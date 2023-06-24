import * as ts from 'typescript';

import { FromWhat } from './common';
import { Imports } from '../types';
import { namespaceBlacklist } from './blacklists';

// Parse use of imports from namespace

type ImportedNamespace = {
  file: string;
  namespaces: string[];
};

const getPossibleImportedNamespaces = (
  imports: Imports,
): ImportedNamespace[] => {
  const keys = Object.keys(imports);
  const imported: ImportedNamespace[] = [];

  keys.forEach((fromFile) => {
    const namespaces = imports[fromFile].map((i) => `${i}.`);
    imported.push({
      file: fromFile,
      namespaces: namespaces,
    });
  });

  return imported;
};

const mayContainImportsFromNamespace = (
  node: ts.Node,
  imports: ImportedNamespace[],
): boolean => {
  const nodeText = node.getText();
  return imports.some((possible) => {
    return possible.namespaces.some((ns) => nodeText.includes(ns));
  });
};

export const addImportsFromNamespace = (
  node: ts.Node,
  imports: Imports,
  addImport: (fw: FromWhat) => void,
): void => {
  const possibles = getPossibleImportedNamespaces(imports);
  if (!mayContainImportsFromNamespace(node, possibles)) {
    return;
  }

  // Scan elements in file, for use of any recognised 'namespace.type'
  const findImportUsagesWithin = (node: ts.Node): void => {
    const nodeText = node.getText();

    possibles.forEach((p) => {
      p.namespaces.forEach((ns) => {
        if (nodeText.startsWith(ns)) {
          addImport({
            from: p.file,
            what: [nodeText],
          });
        }
      });
    });
  };

  const recurseIntoChildren = (next: ts.Node): void => {
    findImportUsagesWithin(next);

    next
      .getChildren()
      .filter((c) => !namespaceBlacklist.includes(c.kind))
      .forEach(recurseIntoChildren);
  };

  recurseIntoChildren(node);
};
