Feature: ts-unused-exports

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

Scenario: Used export default
  Given file "a.ts" is export default 1;
  And file "b.ts" is import a from './a';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Export { symbol } from
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is export { a } from './a';
  And file "c.ts" is import { a } from './b';
  When analyzing "tsconfig.json"
  Then the result is {}
