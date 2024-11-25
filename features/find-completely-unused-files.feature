Feature: Find Completely Unused Files

Background:
  Given file "a.ts" is
    """
    export function sum(a, b) { return a + b; };
    export const a_unused = 1;
    """
  Given file "b.ts" is import {sum} from './a';
  Given file "c.ts" is
    """
    export function minus(a, b) { return a - b; };
    export const b_unused = 1;
    """

Scenario: No Parameter Find Completely Unused Files
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { "a.ts": ["a_unused"], "c.ts": ["minus", "b_unused"]} }
  Then the unused file is undefined

Scenario: With Parameter Find Completely Unused Files
  When analyzing "tsconfig.json" with files ["--findCompletelyUnusedFiles"]
  Then the result is { "unusedExports": { "a.ts": ["a_unused"], "c.ts": ["minus", "b_unused"]} }
  Then the unused file is ["c.ts"]

Scenario: Run CLI With Parameter Find Completely Unused Files
  When running ts-unused-exports "tsconfig.json" --findCompletelyUnusedFiles
  Then the CLI result at status is 1
  And the CLI result at stdout contains "c.ts"