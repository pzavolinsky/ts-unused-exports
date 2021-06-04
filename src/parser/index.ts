import * as ts from 'typescript';
import * as tsconfigPaths from 'tsconfig-paths';

import {
  ExtraCommandLineOptions,
  File,
  Imports,
  LocationInFile,
  TsConfig,
  TsConfigPaths,
} from '../types';

import { FromWhat } from './common';
import { addExportCore } from './export';
import { addImportCore } from './import';
import { indexCandidates } from './util';
import { isNodeDisabledViaComment } from './comment';
import { processNode } from './nodeProcessor';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import path = require('path');

const cleanFilename = (pathIn: string): string => {
  const nameOnly = path.parse(pathIn).name;
  const nameOnlyWithoutIndex = nameOnly.replace(/([\\/])?index\.[^.]*$/, '');

  // Imports always have the '.d' part dropped from the filename,
  // so for the export counting to work with d.ts files, we need to also drop '.d' part.
  // Assumption: the same folder will not contain two files like: a.ts, a.d.ts.
  if (!!nameOnlyWithoutIndex.match(/\.d$/)) {
    return nameOnlyWithoutIndex.substr(0, nameOnly.length - 2);
  }

  return nameOnlyWithoutIndex;
};

// We remove extension, so that we can handle many different file types
const pathWithoutExtension = (pathIn: string): string => {
  const parsed = path.parse(pathIn);

  if (indexCandidates.some((i) => pathIn.endsWith(i))) return parsed.dir;

  return path.join(parsed.dir, cleanFilename(pathIn));
};

const mapFile = (
  path: string,
  file: ts.SourceFile,
  baseUrl: string,
  paths?: TsConfigPaths,
  extraOptions?: ExtraCommandLineOptions,
): File => {
  const imports: Imports = {};
  const exportNames: string[] = [];
  const exportLocations: LocationInFile[] = [];

  const tsconfigPathsMatcher =
    (!!paths && tsconfigPaths.createMatchPath(baseUrl, paths)) || undefined;

  const addImport = (fw: FromWhat): string | undefined => {
    return addImportCore(fw, path, imports, baseUrl, tsconfigPathsMatcher);
  };

  const addExport = (exportName: string, node: ts.Node): void => {
    addExportCore(
      exportName,
      file,
      node,
      exportLocations,
      exportNames,
      extraOptions,
    );
  };

  ts.forEachChild(file, (node: ts.Node) => {
    if (isNodeDisabledViaComment(node, file)) {
      return;
    }

    processNode(
      node,
      path,
      addImport,
      addExport,
      imports,
      exportNames,
      extraOptions,
    );
  });

  return {
    path: pathWithoutExtension(path),
    fullPath: path,
    imports,
    exports: exportNames,
    exportLocations,
  };
};

const parseFile = (
  path: string,
  baseUrl: string,
  paths?: TsConfigPaths,
  extraOptions?: ExtraCommandLineOptions,
): File =>
  mapFile(
    path,
    ts.createSourceFile(
      path,
      readFileSync(path, { encoding: 'utf8' }),
      ts.ScriptTarget.ES2015,
      /*setParentNodes */ true,
    ),
    baseUrl,
    paths,
    extraOptions,
  );

const parsePaths = (
  { baseUrl, files: filePaths, paths }: TsConfig,
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  const includeDeclarationFiles = !extraOptions?.excludeDeclarationFiles;

  const files = filePaths
    .filter((p) => includeDeclarationFiles || !p.includes('.d.'))
    .map((path) => parseFile(resolve('.', path), baseUrl, paths, extraOptions));

  return files;
};

export default (
  TsConfig: TsConfig,
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  return parsePaths(TsConfig, extraOptions);
};
