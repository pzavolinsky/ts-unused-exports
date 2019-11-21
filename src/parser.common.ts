import * as ts from 'typescript';

export const star = ['*'];

export interface FromWhat {
  from: string;
  what: string[];
}

export const TRIM_QUOTES = /^['"](.*)['"]$/;

export const getFromText = (moduleSpecifier: string): string =>
  moduleSpecifier.replace(TRIM_QUOTES, '$1').replace(/\/index$/, '');

export const getFrom = (moduleSpecifier: ts.Expression): string =>
  getFromText(moduleSpecifier.getText());