import * as ts from 'typescript';
import * as tsconfigPaths from 'tsconfig-paths';

import { FromWhat, STAR, getFrom } from './common';
import { dirname, join, relative, resolve, sep } from 'path';

import { Imports } from '../types';
import { existsSync } from 'fs';
import { isUnique } from './util';

// Parse Imports

const EXTENSIONS = ['.d.ts', '.ts', '.tsx', '.js', '.jsx'];

const relativeTo = (rootDir: string, file: string, path: string): string =>
  relative(rootDir, resolve(dirname(file), path));

const isRelativeToBaseDir = (baseDir: string, from: string): boolean =>
  existsSync(resolve(baseDir, `${from}.js`)) ||
  existsSync(resolve(baseDir, `${from}.ts`)) ||
  existsSync(resolve(baseDir, `${from}.tsx`)) ||
  existsSync(resolve(baseDir, from, 'index.js')) ||
  existsSync(resolve(baseDir, from, 'index.ts')) ||
  existsSync(resolve(baseDir, from, 'index.tsx'));

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
        e => (e.propertyName || e.name).text,
      );

  // note on namespaces: when importing a namespace, we cannot differentiate that from another element.
  // (we differentiate on *export*)

  return {
    from,
    what: importDefault.concat(importNames),
  };
};

const declarationFilePatch = (matchedPath: string) => {
  return matchedPath.endsWith('.d') && existsSync(`${matchedPath}.ts`) ?
    matchedPath.slice(0, -2) :
    matchedPath;
}

export const addImportCore = (
  fw: FromWhat,
  rootDir: string,
  path: string,
  imports: Imports,
  baseDir: string,
  baseUrl: string,
  tsconfigPathsMatcher?: tsconfigPaths.MatchPath,
): string | undefined => {
  const { from, what } = fw;

  const getKey = (from: string): string | undefined => {
    if (from[0] == '.') {
      // An undefined return indicates the import is from 'index.ts' or similar == '.'
      return relativeTo(rootDir, path, from) || '.';
    } else {
      let matchedPath;

      return isRelativeToBaseDir(baseDir, from)
        ? join(baseUrl, from)
        : tsconfigPathsMatcher &&
          (matchedPath = tsconfigPathsMatcher(
            from,
            undefined,
            undefined,
            EXTENSIONS,
          ))
        ? declarationFilePatch(matchedPath).replace(`${baseDir}${sep}`, '')
        : undefined;
    }
  };

  const key = getKey(from) || from;
  const items = imports[key] || [];

  imports[key] = items.concat(what).filter(isUnique);
  return key;
};
