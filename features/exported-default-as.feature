Feature: exported default as

Background:
  Given file "a.ts" is export default () => {}

Scenario: Export default as
  Given file "b.ts" is export { default as foo } from './a';
  And file "c.ts" is import {foo} from "./b"
  When analyzing "tsconfig.json"
  Then the result is {}
