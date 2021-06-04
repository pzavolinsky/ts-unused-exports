import ts = require('typescript');

import { namespaceBlacklist } from './namespaceBlacklist';

export function isUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}

export const indexCandidates = ['index', 'index.ts', 'index.tsx', 'index.js'];

export function removeExportStarPrefix(path: string): string {
  if (path.startsWith('*:')) return path.slice(2);
  else if (path.startsWith('*as:')) return path.slice(4);

  return path;
}

// A whitelist, to over-ride namespaceBlacklist.
//
// We need to search some structures that would not have a namespace.
const whitelist = [
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.PropertyAssignment,
  ts.SyntaxKind.JsxElement,
  ts.SyntaxKind.JsxSelfClosingElement,
];

function runForChildren(next: ts.Node, fun: (node: ts.Node) => boolean): void {
  next
    .getChildren()
    .filter(
      (c) => !namespaceBlacklist.includes(c.kind) || whitelist.includes(c.kind),
    )
    .forEach((node) => {
      fun(node);
    });
}

export function recurseIntoChildren(
  next: ts.Node,
  fun: (node: ts.Node) => boolean,
): boolean {
  const alsoProcessChildren = fun(next);

  if (alsoProcessChildren) {
    runForChildren(next, (node: ts.Node) => recurseIntoChildren(node, fun));
  }

  return alsoProcessChildren;
}

export function findAllChildrenOfKind(
  node: ts.Node,
  kind: ts.SyntaxKind,
): ts.Node[] {
  const childrenFound: ts.Node[] = [];

  const innerFindFirstChildOfKind = (childNode: ts.Node): boolean => {
    if (childNode.kind === kind) {
      childrenFound.push(childNode);
    }

    return true;
  };

  recurseIntoChildren(node, innerFindFirstChildOfKind);

  return childrenFound;
}

export function findFirstChildOfKind(
  node: ts.Node,
  kind: ts.SyntaxKind,
): ts.Node | null {
  let childFound: ts.Node | null = null;

  const innerFindFirstChildOfKind = (childNode: ts.Node): boolean => {
    if (!childFound && childNode.kind === kind) {
      childFound = childNode;
      return false;
    }

    return true;
  };

  recurseIntoChildren(node, innerFindFirstChildOfKind);

  return childFound;
}
