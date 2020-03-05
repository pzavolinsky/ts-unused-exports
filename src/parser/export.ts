import * as ts from 'typescript';

import { LocationInFile, ExtraCommandLineOptions } from '../types';
import { FromWhat, STAR, getFrom } from './common';

// Parse Exports

const extractAliasFirstFromElements = (
  elements: ts.NodeArray<ts.ExportSpecifier>,
): string[] => elements.map(e => e.name.text);

export const extractExportStatement = (
  decl: ts.ExportDeclaration,
): string[] => {
  return decl.exportClause
    ? extractAliasFirstFromElements(decl.exportClause.elements)
    : [];
};

export const extractExportFromImport = (
  decl: ts.ExportDeclaration,
  moduleSpecifier: ts.Expression,
): { exported: FromWhat; imported: FromWhat } => {
  const { exportClause } = decl;

  const whatExported = exportClause
    ? // The alias 'name' or the original type is exported
      extractAliasFirstFromElements(exportClause.elements)
    : STAR;

  const whatImported = exportClause
    ? // The original type 'propertyName' is imported
      exportClause.elements.map(e => (e.propertyName || e.name).text)
    : STAR;

  return {
    exported: {
      from: getFrom(moduleSpecifier),
      what: whatExported,
    },
    imported: {
      from: getFrom(moduleSpecifier),
      what: whatImported,
    },
  };
};

// Can be a name like 'a' or else a destructured set like '{ a, b }'
const parseExportNames = (exportName: string): string[] => {
  if (exportName.startsWith('{')) {
    const names = exportName.substring(1, exportName.length - 2);
    return names
      .split(',')
      .map(n => (n.includes(':') ? n.split(':')[1] : n))
      .map(n => n.trim());
  }

  return [exportName];
};

export const extractExportNames = (path: string, node: ts.Node): string[] => {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return parseExportNames(
        (node as ts.VariableStatement).declarationList.declarations[0].name.getText(),
      );
    case ts.SyntaxKind.FunctionDeclaration:
      const { name } = node as ts.FunctionDeclaration;
      return [name ? name.text : 'default'];
    default: {
      console.warn(`WARN: ${path}: unknown export node (kind:${node.kind})`);
      return [''];
    }
  }
};

const TYPE_NODE_KINDS = [
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
];

const shouldNodeTypeBeIgnored = (
  node: ts.Node,
  extraOptions?: ExtraCommandLineOptions,
): boolean => {
  const allowUnusedTypes = !!extraOptions?.allowUnusedTypes;
  if (!allowUnusedTypes) return false;

  return TYPE_NODE_KINDS.includes(node.kind);
};

export const addExportCore = (
  exportName: string,
  file: ts.SourceFile,
  node: ts.Node,
  exportLocations: LocationInFile[],
  exports: string[],
  extraOptions?: ExtraCommandLineOptions,
): void => {
  if (
    exports.includes(exportName) ||
    shouldNodeTypeBeIgnored(node, extraOptions)
  ) {
    return;
  }

  exports.push(exportName);

  const location = file.getLineAndCharacterOfPosition(node.getStart());

  exportLocations.push({
    line: location.line + 1,
    character: location.character,
  });
};
