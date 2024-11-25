Feature: exported function

Background:
  Given file "a.ts" is
    """
    export function sum(a, b) { return a + b; };
    export const a_unused = 1;
    """

Scenario: Not imported
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["sum", "a_unused"]

Scenario: Imported
  Given file "b.ts" is import {sum} from './a';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { "a.ts": ["a_unused"]} }
