import * as ts from 'typescript';

import { ENUM_NODE_KINDS, TYPE_OR_INTERFACE_NODE_KINDS } from './kinds';
import { ExtraCommandLineOptions, LocationInFile } from '../types';
import { FromWhat, STAR, getFrom } from './common';

// Parse Exports

const extractAliasFirstFromElements = (
  elements: ts.NodeArray<ts.ExportSpecifier>,
): string[] => elements.map((e) => e.name.text);

const extractPropertyOrAliasFirstFromElements = (
  elements: ts.NodeArray<ts.ExportSpecifier>,
): string[] => elements.map((e) => (e.propertyName || e.name).text);

const extractFromBindingsWith = (
  bindings: ts.NamedExportBindings,
  extract: (elements: ts.NodeArray<ts.ExportSpecifier>) => string[],
): string[] => {
  if (ts.isNamedExports(bindings)) return extract(bindings.elements);

  return [bindings.name.text];
};

const extractAliasFirstFromBindings = (
  bindings: ts.NamedExportBindings,
): string[] => {
  return extractFromBindingsWith(bindings, extractAliasFirstFromElements);
};

const extractPropertyOrAliasFromBindings = (
  bindings: ts.NamedExportBindings,
): string[] => {
  return extractFromBindingsWith(
    bindings,
    extractPropertyOrAliasFirstFromElements,
  );
};

export const extractExportStatement = (
  decl: ts.ExportDeclaration,
): string[] => {
  return decl.exportClause
    ? extractAliasFirstFromBindings(decl.exportClause)
    : [];
};

export const extractExportFromImport = (
  decl: ts.ExportDeclaration,
  moduleSpecifier: ts.Expression,
): { exported: FromWhat; imported: FromWhat } => {
  const { exportClause } = decl;

  const whatExported = exportClause
    ? // The alias 'name' or the original type is exported
      extractAliasFirstFromBindings(exportClause)
    : STAR;

  const whatImported = exportClause
    ? // The original type 'propertyName' is imported
      extractPropertyOrAliasFromBindings(exportClause)
    : STAR;

  const from = getFrom(moduleSpecifier);
  return {
    exported: {
      from,
      what: whatExported,
    },
    imported: {
      from,
      what: whatImported,
      isExportStarAs: exportClause?.kind === ts.SyntaxKind.NamespaceExport,
    },
  };
};

// Can be a name like 'a' or else a destructured set like '{ a, b }'
const parseExportNames = (exportName: string): string[] => {
  if (exportName.startsWith('{')) {
    const names = exportName.substring(1, exportName.length - 2);
    return names
      .split(',')
      .map((n) => (n.includes(':') ? n.split(':')[1] : n))
      .map((n) => n.trim());
  }

  return [exportName];
};

export const extractExportNames = (path: string, node: ts.Node): string[] => {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return parseExportNames(
        // prettier-ignore
        (
          node as ts.VariableStatement
        ).declarationList.declarations[0].name.getText(),
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

const shouldNodeTypeBeIgnored = (
  node: ts.Node,
  extraOptions?: ExtraCommandLineOptions,
): boolean => {
  const allowUnusedTypes = !!extraOptions?.allowUnusedTypes;
  const allowUnusedEnums = !!extraOptions?.allowUnusedEnums;

  if (allowUnusedTypes && allowUnusedEnums)
    return (
      TYPE_OR_INTERFACE_NODE_KINDS.includes(node.kind) ||
      ENUM_NODE_KINDS.includes(node.kind)
    );

  if (allowUnusedTypes) return TYPE_OR_INTERFACE_NODE_KINDS.includes(node.kind);

  if (allowUnusedEnums) return ENUM_NODE_KINDS.includes(node.kind);

  return false;
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
