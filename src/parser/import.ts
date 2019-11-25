import { dirname, join, relative, resolve, sep } from 'path';
import { existsSync } from 'fs';
import * as tsconfigPaths from 'tsconfig-paths';
import * as ts from 'typescript';

import { getFrom, FromWhat, star } from './common';
import { Imports } from '../types';

// Parse Imports

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

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
      what: star,
    };

  const { namedBindings } = importClause;
  const importDefault = !!importClause.name ? ['default'] : [];
  const importStar =
    namedBindings && !!(namedBindings as ts.NamespaceImport).name ? star : [];
  const importNames =
    namedBindings && !importStar.length
      ? (namedBindings as ts.NamedImports).elements.map(
          e => (e.propertyName || e.name).text,
        )
      : [];

  return {
    from,
    what: importDefault.concat(importStar, importNames),
  };
};

export const addImportCore = (
  fw: FromWhat,
  rootDir: string,
  path: string,
  imports: Imports,
  tsconfigPathsMatcher?: tsconfigPaths.MatchPath,
  baseDir?: string,
  baseUrl?: string,
): string | undefined => {
  const { from, what } = fw;

  const getKey = (from: string): string | undefined => {
    if (from[0] == '.') {
      // An undefined return indicates the import is from 'index.ts' or similar == '.'
      return relativeTo(rootDir, path, from) || '.';
    } else if (baseDir && baseUrl) {
      let matchedPath;

      return isRelativeToBaseDir(baseDir, from)
        ? baseUrl && join(baseUrl, from)
        : tsconfigPathsMatcher &&
          (matchedPath = tsconfigPathsMatcher(
            from,
            undefined,
            undefined,
            EXTENSIONS,
          ))
        ? matchedPath.replace(`${baseDir}${sep}`, '')
        : undefined;
    }

    return undefined;
  };

  const key = getKey(from);
  if (!key) return undefined;
  const items = imports[key] || [];
  imports[key] = items.concat(what);
  return key;
};
