Feature: exported default named function

Background:
  Given file "a.ts" is export default function iAmDefault() { return 2; };

Scenario: Missing default
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["default"]

Scenario: Import default
  Given file "b.ts" is import def from './a';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }
