Feature: pass files explicitly

Scenario: Pass all files
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is import { a } from './a';
  When analyzing "tsconfig.json" with files ["a.ts", "b.ts"]
  Then the result is {}

Scenario: Omit some file
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is import { a } from './a';
  When analyzing "tsconfig.json" with files ["a.ts"]
  Then the result is { "a.ts": ["a"] }
