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
import { isNodeDisabledViaComment } from './comment';
import { processNode } from './nodeProcessor';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import path = require('path');

// We remove extension, so that we can handle many different file types
const pathWithoutExtension = (pathIn: string): string => {
  const nameOnly = path.parse(pathIn).name;
  let nameOnlyWithoutIndex = nameOnly.replace(/([\\/])?index\.[^.]*$/, '');

  // Imports always have the '.d' part dropped from the filename,
  // so for the export counting to work with d.ts files, we need to also drop '.d' part.
  // Assumption: the same folder will not contain two files like: a.ts, a.d.ts.
  if (!!nameOnlyWithoutIndex.match(/\.d$/)) {
    nameOnlyWithoutIndex = nameOnlyWithoutIndex.substr(0, nameOnly.length - 2);
  }

  const parsed = path.parse(pathIn);

  if (
    pathIn.endsWith('index.ts') ||
    pathIn.endsWith('index.tsx') ||
    pathIn.endsWith('index.js')
  )
    // xxx other cases??
    return parsed.dir;

  const result = path.join(parsed.dir, nameOnlyWithoutIndex);
  return result;
};

const mapFile = (
  rootDir: string,
  path: string,
  file: ts.SourceFile,
  baseUrl: string,
  paths?: TsConfigPaths,
  extraOptions?: ExtraCommandLineOptions,
): File => {
  const imports: Imports = {};
  const exportNames: string[] = [];
  const exportLocations: LocationInFile[] = [];

  const baseDir = baseUrl; // xxx remove baseDir
  const tsconfigPathsMatcher =
    (!!paths && tsconfigPaths.createMatchPath(baseDir, paths)) || undefined;

  const addImport = (fw: FromWhat): string | undefined => {
    return addImportCore(
      fw,
      rootDir,
      path,
      imports,
      baseDir,
      baseUrl,
      tsconfigPathsMatcher,
    );
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
  rootDir: string,
  path: string,
  baseUrl: string,
  paths?: TsConfigPaths,
  extraOptions?: ExtraCommandLineOptions,
): File =>
  mapFile(
    rootDir,
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
  rootDir: string,
  { baseUrl, files: filePaths, paths }: TsConfig,
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  const includeDeclarationFiles = !extraOptions?.excludeDeclarationFiles;

  const files = filePaths
    .filter((p) => includeDeclarationFiles || !p.includes('.d.'))
    .map((path) =>
      parseFile(rootDir, resolve(rootDir, path), baseUrl, paths, extraOptions),
    );

  return files;
};

export default (
  rootDir: string,
  TsConfig: TsConfig,
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  return parsePaths(rootDir, TsConfig, extraOptions);
};
