import * as ts from 'typescript';
import { FromWhat, getFromText } from './common';

// Parse Dynamic Imports

export const mayContainDynamicImports = (node: ts.Node): boolean =>
  node.getText().indexOf('import(') > -1;

type WithExpression = ts.Node & {
  expression: ts.Expression;
};

export function isWithExpression(node: ts.Node): node is WithExpression {
  const myInterface = node as WithExpression;
  return !!myInterface.expression;
}

type WithArguments = ts.Node & {
  arguments: ts.NodeArray<ts.Expression>;
};

export function isWithArguments(node: ts.Node): node is WithArguments {
  const myInterface = node as WithArguments;
  return !!myInterface.arguments;
}

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
            addImport({
              from: getFromText(importing),
              what: ['default'],
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

  const recurseIntoChildren = (next: ts.Node): void => {
    addImportsInAnyExpression(next);

    next.getChildren().forEach(recurseIntoChildren);
  };

  recurseIntoChildren(node);
};
