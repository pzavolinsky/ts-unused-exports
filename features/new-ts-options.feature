Feature: baseUrl

Background:
  Given file "tsconfig.json" is
    """
    {
    // noUncheckedIndexedAccess - added in TS 4.1
    "compilerOptions": { "noUncheckedIndexedAccess ": true },
    "include": ["**/*.ts", "**/*.tsx"]
    }
    """

Scenario: Unused export const
  Given file "a.ts" is export const a = 1;
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["a"]

Scenario: Unused export default
  Given file "a.ts" is export default 1;
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["default"]

Scenario: Used export const
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is import { a } from './a';
  When analyzing "tsconfig.json"
  Then the result is {}
