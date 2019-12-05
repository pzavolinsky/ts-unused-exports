import * as ts from 'typescript';

import { LocationInFile } from '../types';
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

export const extractExport = (path: string, node: ts.Node): string => {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return (node as ts.VariableStatement).declarationList.declarations[0].name.getText();
    case ts.SyntaxKind.FunctionDeclaration:
      const { name } = node as ts.FunctionDeclaration;
      return name ? name.text : 'default';
    default: {
      console.warn(`WARN: ${path}: unknown export node (kind:${node.kind})`);
      break;
    }
  }
  return '';
};

export const addExportCore = (
  exportName: string,
  file: ts.SourceFile,
  node: ts.Node,
  exportLocations: LocationInFile[],
  exports: string[],
): void => {
  exports.push(exportName);

  const location = file.getLineAndCharacterOfPosition(node.getStart());

  exportLocations.push({
    line: location.line + 1,
    character: location.character,
  });
};
