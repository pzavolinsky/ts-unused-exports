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
import { FromWhat, STAR } from './common';
import { addDynamicImports, mayContainDynamicImports } from './dynamic';
import {
  addExportCore,
  extractExport,
  extractExportFromImport,
  extractExportStatement,
} from './export';
import { addImportCore, extractImport } from './import';
import { addImportsFromNamespace } from './imports-from-namespace';
import { relative, resolve } from 'path';

import { isNodeDisabledViaComment } from './comment';
import { readFileSync } from 'fs';

const hasModifier = (node: ts.Node, mod: ts.SyntaxKind): boolean | undefined =>
  node.modifiers && node.modifiers.filter(m => m.kind === mod).length > 0;

const extractFilename = (rootDir: string, path: string): string => {
  let name = relative(rootDir, path).replace(/([\\/]index)?\.[^.]*$/, '');

  // Imports always have the '.d' part dropped from the filename,
  // so for the export counting to work with d.ts files, we need to also drop '.d' part.
  // Assumption: the same folder will not contain two files like: a.ts, a.d.ts.
  if (!!name.match(/\.d$/)) {
    name = name.substr(0, name.length - 2);
  }

  return name;
};

const processNode = (
  node: ts.Node,
  path: string,
  addImport: (fw: FromWhat) => string | undefined,
  addExport: (exportName: string, node: ts.Node) => void,
  imports: Imports,
  exports: string[],
  extraOptions?: ExtraCommandLineOptions,
  namespace = '',
): void => {
  const { kind } = node;

  const processSubNode = (subNode: ts.Node, namespace: string): void => {
    processNode(
      subNode,
      path,
      addImport,
      addExport,
      imports,
      exports,
      extraOptions,
      namespace,
    );
  };

  if (kind === ts.SyntaxKind.ImportDeclaration) {
    addImport(extractImport(node as ts.ImportDeclaration));
    return;
  }

  if (kind === ts.SyntaxKind.ExportAssignment) {
    addExport('default', node);
    return;
  }

  if (kind === ts.SyntaxKind.ExportDeclaration) {
    const exportDecl = node as ts.ExportDeclaration;
    const { moduleSpecifier } = exportDecl;
    if (moduleSpecifier === undefined) {
      extractExportStatement(exportDecl).forEach(e => addExport(e, node));
      return;
    } else {
      const { exported, imported } = extractExportFromImport(
        exportDecl,
        moduleSpecifier,
      );
      const key = addImport(imported);
      if (key) {
        const { what } = exported;
        if (what == STAR) {
          addExport(`*:${key}`, node);
        } else {
          what.forEach(w => exports.push(w));
        }
      }
      return;
    }
  }

  // Searching for dynamic imports requires inspecting statements in the file,
  // so for performance should only be done when necessary.
  if (mayContainDynamicImports(node)) {
    addDynamicImports(node, addImport);
  }

  // Searching for use of types in namespace requires inspecting statements in the file,
  // so for performance should only be done when necessary.
  if (extraOptions?.enableSearchNamespaces) {
    addImportsFromNamespace(node, imports, addImport);
  }

  if (hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
    if (hasModifier(node, ts.SyntaxKind.DefaultKeyword)) {
      addExport('default', node);
      return;
    }
    const decl = node as ts.DeclarationStatement;
    const name = decl.name ? decl.name.text : extractExport(path, node);

    if (name) {
      addExport(namespace + name, node);

      if (extraOptions?.enableSearchNamespaces) {
        node
          .getChildren()
          .filter(c => c.kind === ts.SyntaxKind.Identifier)
          .forEach(c => {
            processSubNode(c, namespace + name + '.');
          });

        namespace = namespace + name + '.';
      }
    }
  }

  if (namespace.length > 0) {
    // in namespace: need to process children
    node.getChildren().forEach(c => {
      processSubNode(c, namespace);
    });
  }
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
  const exports: string[] = [];
  const exportLocations: LocationInFile[] = [];
  const name = extractFilename(rootDir, path);

  const baseDir = resolve(rootDir, baseUrl);
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
    addExportCore(exportName, file, node, exportLocations, exports);
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
      exports,
      extraOptions,
    );
  });

  return {
    path: name,
    fullPath: path,
    imports,
    exports,
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
    .filter(p => includeDeclarationFiles || p.indexOf('.d.') === -1)
    .map(path =>
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
