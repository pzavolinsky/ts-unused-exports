import * as ts from 'typescript';

import { FromWhat, getFromText } from './common';

import { namespaceBlacklist } from './namespaceBlacklist';

// Parse Dynamic Imports

export const mayContainDynamicImports = (node: ts.Node): boolean =>
  !namespaceBlacklist.includes(node.kind) && node.getText().includes('import(');

type WithExpression = ts.Node & {
  expression: ts.Expression;
};

function isWithExpression(node: ts.Node): node is WithExpression {
  const myInterface = node as WithExpression;
  return !!myInterface.expression;
}

type WithArguments = ts.Node & {
  arguments: ts.NodeArray<ts.Expression>;
};

function isWithArguments(node: ts.Node): node is WithArguments {
  const myInterface = node as WithArguments;
  return !!myInterface.arguments;
}

const recurseIntoChildren = (
  next: ts.Node,
  fun: (node: ts.Node) => void,
): void => {
  fun(next);

  next
    .getChildren()
    .filter(c => !namespaceBlacklist.includes(c.kind))
    .forEach(node => recurseIntoChildren(node, fun));
};

/* Handle lambdas where the content uses imported types, via dereferencing.
 * example:
 * A_imported => {
 *   console.log(A_imported.A);
 * }
 */
const findLambdasWithDereferencing = (node: ts.Node): string[] => {
  const what: string[] = [];

  const processLambda = (lambda: ts.Node): void => {
    if (lambda.getChildCount() === 3) {
      const paramName = lambda.getChildren()[0].getText();

      const usagePrefix = `${paramName}.`;
      recurseIntoChildren(lambda, child => {
        if (child.getText().startsWith(usagePrefix)) {
          const usage = child.getText().substring(usagePrefix.length);
          what.push(usage);
        }
      });
    }
  };

  recurseIntoChildren(node, child => {
    if (child.kind === ts.SyntaxKind.ArrowFunction) {
      processLambda(child);
    }
  });

  return what;
};

export const addDynamicImports = (
  node: ts.Node,
  addImport: (fw: FromWhat) => void,
): void => {
  const addImportsInAnyExpression = (node: ts.Node): void => {
    const getArgumentFrom = (node: ts.Node): string | undefined => {
      if (isWithArguments(node)) {
        return node.arguments[0].getText();
      }
    };

    if (isWithExpression(node)) {
      let expr = node;
      while (isWithExpression(expr)) {
        const newExpr = expr.expression;

        if (newExpr.getText() === 'import') {
          const importing = getArgumentFrom(expr);

          if (!!importing) {
            const what = ['default'].concat(findLambdasWithDereferencing(node));

            addImport({
              from: getFromText(importing),
              what,
            });
          }
        }

        if (isWithExpression(newExpr)) {
          expr = newExpr;
        } else {
          break;
        }
      }
    }
  };

  // Recurse, since dynamic imports can occur at nested levels within the code
  recurseIntoChildren(node, addImportsInAnyExpression);
};
