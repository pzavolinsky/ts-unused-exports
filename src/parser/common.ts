import * as ts from 'typescript';

export const STAR = ['*'];

export interface FromWhat {
  from: string;
  what: string[];
  isExportStarAs?: boolean; // If true, then the 'what' is an export-namespace with exported contents of 'from'
}

const TRIM_QUOTES = /^['"](.*)['"]$/;

export const getFromText = (moduleSpecifier: string): string =>
  moduleSpecifier
    .replace(TRIM_QUOTES, '$1')
    .replace(/\/index(.[mc]?js)?$/, '/index'); // Do not completely remove /index as then is ambiguous between file or folder name

export const getFrom = (moduleSpecifier: ts.Expression): string =>
  getFromText(moduleSpecifier.getText());
