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

// A whitelist, to over-ride namespaceBlacklist.
//
// We need to search some structures that would not have a namespace.
const whitelist = [ts.SyntaxKind.MethodDeclaration];

const runForChildren = (
  next: ts.Node,
  fun: (node: ts.Node) => boolean,
): void => {
  next
    .getChildren()
    .filter(
      c => !namespaceBlacklist.includes(c.kind) || whitelist.includes(c.kind),
    )
    .forEach(node => fun(node));
};

const recurseIntoChildren = (
  next: ts.Node,
  fun: (node: ts.Node) => boolean,
): boolean => {
  const alsoProcessChildren = fun(next);

  if (alsoProcessChildren) {
    runForChildren(next, (node: ts.Node) => recurseIntoChildren(node, fun));
  }

  return alsoProcessChildren;
};

const parseDereferencedLambdaParamsToTypes = (
  paramName: string,
  lambda: ts.Node,
): string[] => {
  const types: string[] = [];

  const usagePrefix = `${paramName}.`;
  recurseIntoChildren(lambda, child => {
    if (child.getText().startsWith(usagePrefix)) {
      const usage = child.getText().substring(usagePrefix.length);
      types.push(usage);
    }

    return true;
  });

  return types;
};

const parseDestructuredLambdaParamsToTypes = (paramList: string): string[] => {
  if (paramList.startsWith('{')) {
    const names = paramList.substring(1, paramList.length - 2);

    return names
      .split(',')
      .map(n => (n.includes(':') ? n.split(':')[0] : n))
      .map(n => n.trim());
  }

  return [paramList];
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

      parseDereferencedLambdaParamsToTypes(paramName, lambda).forEach(t =>
        what.push(t),
      );
    } else if (
      lambda.getChildCount() === 5 &&
      lambda.getChildAt(1).kind == ts.SyntaxKind.SyntaxList
    ) {
      const paramNames = lambda.getChildren()[1].getText();

      parseDestructuredLambdaParamsToTypes(paramNames).forEach(p =>
        what.push(p),
      );
    }
  };

  recurseIntoChildren(node, child => {
    if (child.kind === ts.SyntaxKind.ArrowFunction) {
      processLambda(child);
      return false;
    }

    return true;
  });

  return what;
};

export const addDynamicImports = (
  node: ts.Node,
  addImport: (fw: FromWhat) => void,
): void => {
  const addImportsInAnyExpression = (node: ts.Node): boolean => {
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

    return true;
  };

  // Recurse, since dynamic imports can occur at nested levels within the code
  recurseIntoChildren(node, addImportsInAnyExpression);
};
