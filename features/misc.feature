Feature: misc

Scenario: Import JSON
  Given file "consts.json" is module.exports = 1;
  And file "index.ts" is import * as CONSTS from './consts.json';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }

Scenario: Import JSON index
  Given file "index.json" is module.exports = 1;
  And file "file.ts" is import * as CONSTS from '.';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }

Scenario: Import non-existent symbol (not valid TS!)
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is import { b } from './a';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { "a.ts": ["a"] } }

Scenario: Import non-existent file (not valid TS - but tests robustness)
  Given file "b.ts" is import { b } from './non-existent';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { } }

Scenario: Disable with comments
  Given file "a.ts" is
    """
    // ts-unused-exports:disable-next-line
    export const a = 1;
    export const b = 1;
    """
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { "a.ts": ["b"] } }
