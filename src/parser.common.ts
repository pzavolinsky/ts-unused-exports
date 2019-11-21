export interface FromWhat {
  from: string;
  what: string[];
}

export const TRIM_QUOTES = /^['"](.*)['"]$/;

export const getFromText = (moduleSpecifier: string): string =>
  moduleSpecifier.replace(TRIM_QUOTES, '$1').replace(/\/index$/, '');
