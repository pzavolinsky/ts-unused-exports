import * as ts from 'typescript';
import * as tsconfigPaths from 'tsconfig-paths';

import { FromWhat, STAR, getFrom } from './common';
import { dirname, resolve } from 'path';

import { Imports } from '../types';
import { existsSync } from 'fs';
import { isUnique } from './util';

import path = require('path');

// Parse Imports

const EXTENSIONS = ['.d.ts', '.ts', '.tsx', '.js', '.jsx'];

const isRelativeToBaseDir = (baseDir: string, from: string): boolean =>
  existsSync(resolve(baseDir, `${from}.js`)) ||
  existsSync(resolve(baseDir, `${from}.ts`)) ||
  existsSync(resolve(baseDir, `${from}.d.ts`)) ||
  existsSync(resolve(baseDir, `${from}.tsx`)) ||
  existsSync(resolve(baseDir, from, 'index.js')) ||
  existsSync(resolve(baseDir, from, 'index.ts')) ||
  existsSync(resolve(baseDir, from, 'index.tsx'));

const joinWithBaseUrl = (baseUrl: string, from: string) => {
  if (!from.startsWith(baseUrl)) return path.join(baseUrl, from);

  return from;
};

export const extractImport = (decl: ts.ImportDeclaration): FromWhat => {
  const from = getFrom(decl.moduleSpecifier);
  const { importClause } = decl;
  if (!importClause)
    return {
      from,
      what: STAR,
    };

  const { namedBindings } = importClause;
  const importDefault = !!importClause.name ? ['default'] : [];

  if (!namedBindings) {
    return {
      from,
      what: importDefault,
    };
  }

  const isStar = !!(namedBindings as ts.NamespaceImport).name;

  const importNames = isStar
    ? STAR
    : (namedBindings as ts.NamedImports).elements.map(
        (e) => (e.propertyName || e.name).text,
      );

  // note on namespaces: when importing a namespace, we cannot differentiate that from another element.
  // (we differentiate on *export*)

  return {
    from,
    what: importDefault.concat(importNames),
  };
};

const declarationFilePatch = (matchedPath: string): string => {
  return matchedPath.endsWith('.d') && existsSync(`${matchedPath}.ts`)
    ? matchedPath.slice(0, -2)
    : matchedPath;
};

export const addImportCore = (
  fw: FromWhat,
  pathIn: string,
  imports: Imports,
  baseUrl: string,
  tsconfigPathsMatcher?: tsconfigPaths.MatchPath,
): string | undefined => {
  const { from, what } = fw;

  const getKey = (from: string): string => {
    if (from[0] == '.') {
      // An undefined return indicates the import is from 'index.ts' or similar == '.'
      return resolve(dirname(pathIn), from) || '.';
    } else {
      let matchedPath;

      if (isRelativeToBaseDir(baseUrl, from)) {
        return joinWithBaseUrl(baseUrl, from);
      }

      if (
        tsconfigPathsMatcher &&
        (matchedPath = tsconfigPathsMatcher(
          from,
          undefined,
          undefined,
          EXTENSIONS,
        ))
      ) {
        const matched = declarationFilePatch(matchedPath);

        if (!matched.startsWith(baseUrl)) return path.join(baseUrl, matched);

        // Use join to normalize path separators, since tsconfig-path can return mixed path separators (Windows)
        return path.join(matched);
      }

      return joinWithBaseUrl(baseUrl, from);
    }
  };

  const key = getKey(from);
  const items = imports[key] || [];

  imports[key] = items.concat(what).filter(isUnique);
  return key;
};
