import * as ts from 'typescript';

import { FromWhat } from './common';
import { Imports } from '../types';
import { hasWhiteSpace } from './util';

// Parse use of imports from namespace

type ImportedNamespace = {
  file: string;
  namespaces: string[];
};

const getPossibleImportedNamespaces = (
  node: ts.Node,
  imports: Imports,
): ImportedNamespace[] => {
  const keys = Object.keys(imports);
  const imported: ImportedNamespace[] = [];

  keys.forEach(fromFile => {
    const namespaces = imports[fromFile].map(i => `${i}.`);
    imported.push({
      file: fromFile,
      namespaces: namespaces,
    });
  });

  return imported;
};

export const mayContainImportsFromNamespace = (
  node: ts.Node,
  imports: Imports,
): boolean => {
  const nodeText = node.getText();
  return getPossibleImportedNamespaces(node, imports).some(possible => {
    return possible.namespaces.some(ns => nodeText.includes(ns));
  });
};

export const addImportsFromNamespace = (
  node: ts.Node,
  imports: Imports,
  addImport: (fw: FromWhat) => void,
): void => {
  const possibles = getPossibleImportedNamespaces(node, imports);

  // Scan elements in file, for use of any recognised 'namespace.type'
  const addImportsInAnyExpression = (node: ts.Node): void => {
    possibles.forEach(p => {
      p.namespaces.forEach(ns => {
        if (node.getText().startsWith(ns) && !hasWhiteSpace(node.getText())) {
          addImport({
            from: p.file,
            what: [node.getText()],
          });
        }
      });
    });
  };

  const recurseIntoChildren = (next: ts.Node): void => {
    addImportsInAnyExpression(next);

    next.getChildren().forEach(recurseIntoChildren);
  };

  recurseIntoChildren(node);
};
