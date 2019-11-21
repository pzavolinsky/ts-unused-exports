import * as ts from 'typescript';

import { LocationInFile } from './types';
import { FromWhat, star, getFrom } from './parser.common';

export const extractExportStatement = (
  decl: ts.ExportDeclaration,
): string[] => {
  return decl.exportClause
    ? decl.exportClause.elements.map(e => (e.name || e.propertyName).text)
    : [];
};

export const extractExportFromImport = (
  decl: ts.ExportDeclaration,
  moduleSpecifier: ts.Expression,
): FromWhat => {
  const { exportClause } = decl;
  const what = exportClause
    ? exportClause.elements.map(e => (e.propertyName || e.name).text)
    : star;

  return {
    from: getFrom(moduleSpecifier),
    what,
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
