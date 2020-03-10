import * as ts from 'typescript';

import { FromWhat, getFromText } from './common';
import {
  findAllChildrenOfKind,
  findFirstChildOfKind,
  recurseIntoChildren,
} from './util';

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

  const firstArrow = findFirstChildOfKind(node, ts.SyntaxKind.ArrowFunction);
  if (firstArrow) {
    processLambda(firstArrow);
  }

  return what;
};

const addImportViaLambda = (
  node: ts.Node,
  from: string,
  addImport: (fw: FromWhat) => void,
): boolean => {
  const whatFromLambda = findLambdasWithDereferencing(node);
  const what = ['default'].concat(whatFromLambda);

  addImport({
    from: getFromText(from),
    what,
  });

  return whatFromLambda.length !== 0;
};

const tryParseExpression = (
  expr: ts.Expression,
  addImport: (fw: FromWhat) => void,
): boolean => {
  if (expr.getText().startsWith('import')) {
    const callExpression = findFirstChildOfKind(
      expr,
      ts.SyntaxKind.CallExpression,
    );
    if (!callExpression?.getText().startsWith('import')) {
      return false;
    }

    const syntaxListWithFrom = findFirstChildOfKind(
      callExpression,
      ts.SyntaxKind.SyntaxList,
    );
    if (!syntaxListWithFrom) {
      return false;
    }

    const from = syntaxListWithFrom.getText();

    return addImportViaLambda(expr, from, addImport);
  }

  return false;
};

const handleImportWithJsxAttributes = (
  attributes: ts.JsxAttributes,
  addImport: (fw: FromWhat) => void,
): void => {
  attributes.properties.forEach(prop => {
    if (ts.isJsxAttribute(prop)) {
      if (
        prop.initializer &&
        ts.isJsxExpression(prop.initializer) &&
        prop.initializer.expression
      ) {
        tryParseExpression(prop.initializer.expression, addImport);
      }
    }
  });
};

const handleImportWithinExpression = (
  node: ts.Node,
  addImport: (fw: FromWhat) => void,
): void => {
  let expr = node;

  while (isWithExpression(expr)) {
    const newExpr = expr.expression;

    if (!tryParseExpression(newExpr, addImport)) {
      if (ts.isJsxElement(newExpr) || ts.isJsxFragment(newExpr)) {
        const jsxExpressions = findAllChildrenOfKind(
          newExpr,
          ts.SyntaxKind.JsxExpression,
        );

        jsxExpressions.forEach(j => {
          const jsxExpr = j as ts.JsxExpression;
          if (jsxExpr.expression) {
            tryParseExpression(jsxExpr.expression, addImport);
          }
        });
      }

      const selfClosingElements = findAllChildrenOfKind(
        newExpr,
        ts.SyntaxKind.JsxSelfClosingElement,
      );

      selfClosingElements.forEach(elem => {
        if (ts.isJsxSelfClosingElement(elem)) {
          handleImportWithJsxAttributes(elem.attributes, addImport);
        }
      });
    }

    if (isWithExpression(newExpr)) {
      expr = newExpr;
    } else {
      break;
    }
  }
};

export const addDynamicImports = (
  node: ts.Node,
  addImport: (fw: FromWhat) => void,
): void => {
  const addImportsInAnyExpression = (node: ts.Node): boolean => {
    if (isWithExpression(node)) {
      handleImportWithinExpression(node, addImport); // can be a ParenthesizedExpression with a JSX element inside it
    }

    return true;
  };

  // Recurse, since dynamic imports can occur at nested levels within the code
  recurseIntoChildren(node, addImportsInAnyExpression);
};
