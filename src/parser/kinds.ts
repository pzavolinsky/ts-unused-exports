import * as ts from 'typescript';

export const TYPE_OR_INTERFACE_NODE_KINDS = [
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
];
export const ENUM_NODE_KINDS = [ts.SyntaxKind.EnumDeclaration];
