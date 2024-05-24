import * as ts from 'typescript';

import { ExtraCommandLineOptions, Imports } from '../types';
import { FromWhat, STAR } from './common';
import { addDynamicImports, mayContainDynamicImports } from './dynamic';
import {
  extractExportFromImport,
  extractExportNames,
  extractExportStatement,
} from './export';

import { ENUM_NODE_KINDS } from './kinds';
import { addImportsFromNamespace } from './imports-from-namespace';
import { extractImport } from './import';
import { ignoreLocalBlacklist, namespaceBlacklist } from './blacklists';
import { removeTsFileExtension } from './util';

type NamespaceHolder = {
  namespace: string;
};

const hasModifier = (node: ts.Node, mod: ts.SyntaxKind): boolean | undefined =>
  node.modifiers && node.modifiers.filter((m) => m.kind === mod).length > 0;

const processExportDeclaration = (
  node: ts.Node,
  addImport: (fw: FromWhat) => string | undefined,
  addExport: (exportName: string, node: ts.Node) => void,
  exportNames: string[],
  extraOptions?: ExtraCommandLineOptions,
): void => {
  const exportDecl = node as ts.ExportDeclaration;
  if (
    (exportDecl.isTypeOnly && extraOptions?.allowUnusedTypes) ||
    (ENUM_NODE_KINDS.includes(exportDecl.kind) &&
      extraOptions?.allowUnusedEnums)
  ) {
    return;
  }
  const { moduleSpecifier } = exportDecl;
  if (moduleSpecifier === undefined) {
    extractExportStatement(exportDecl).forEach((e) => addExport(e, node));
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
      }
      if (what != STAR) {
        if (imported.isExportStarAs) {
          addExport(`*as:${key}`, node);
        }
        what.forEach((w) => exportNames.push(w));
      }
    }
    return;
  }
};

const processExportKeyword = (
  node: ts.Node,
  path: string,
  addExport: (exportName: string, node: ts.Node) => void,
  namespace: NamespaceHolder,
  processSubNode: (subNode: ts.Node, namespace: string) => void,
  extraOptions?: ExtraCommandLineOptions,
): void => {
  if (hasModifier(node, ts.SyntaxKind.DefaultKeyword)) {
    addExport('default', node);
    return;
  }
  const decl = node as ts.DeclarationStatement;
  const names = decl.name ? [decl.name.text] : extractExportNames(path, node);

  names
    .filter((name) => !!name)
    .forEach((name) => {
      addExport(namespace.namespace + name, node);

      if (extraOptions?.searchNamespaces) {
        // performance: halves the time taken on large codebase (150k loc)
        const isNamespace = node
          .getChildren()
          .some((c) => c.kind === ts.SyntaxKind.NamespaceKeyword);

        if (isNamespace) {
          // Process the children, in case they *export* any types:
          node
            .getChildren()
            .filter((c) => c.kind === ts.SyntaxKind.Identifier)
            .forEach((c) => {
              processSubNode(c, namespace.namespace + name + '.');
            });

          namespace.namespace += name + '.';
        }
      }
    });
};

export const processNode = (
  node: ts.Node,
  path: string,
  addImport: (fw: FromWhat) => string | undefined,
  addExport: (exportName: string, node: ts.Node) => void,
  imports: Imports,
  exportNames: string[],
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
      exportNames,
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
    processExportDeclaration(
      node,
      addImport,
      addExport,
      exportNames,
      extraOptions,
    );
  }

  // Searching for dynamic imports requires inspecting statements in the file,
  // so for performance should only be done when necessary.
  if (mayContainDynamicImports(node)) {
    addDynamicImports(node, addImport);
  }

  // Searching for use of types in namespace requires inspecting statements in the file,
  // so for performance should only be done when necessary.
  if (extraOptions?.searchNamespaces) {
    addImportsFromNamespace(node, imports, addImport);
  }

  if (extraOptions?.ignoreLocallyUsed && kind === ts.SyntaxKind.Identifier) {
    addImport({
      from: removeTsFileExtension(node.getSourceFile().fileName),
      what: [node.getText()],
    });
  }

  if (hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
    const nsHolder = {
      namespace,
    };
    processExportKeyword(
      node,
      path,
      addExport,
      nsHolder,
      processSubNode,
      extraOptions,
    );
    namespace = nsHolder.namespace;
  }

  if (namespace.length > 0 || extraOptions?.ignoreLocallyUsed) {
    // In namespace: need to process children, in case they *import* any types
    // If ignoreLocallyUsed: need to iterate through whole AST to find local uses of exported variables
    const blacklist = extraOptions?.ignoreLocallyUsed
      ? ignoreLocalBlacklist
      : namespaceBlacklist;
    node
      .getChildren()
      .filter((c) => !blacklist.includes(c.kind))
      .forEach((c) => {
        processSubNode(c, namespace);
      });
  }
};
