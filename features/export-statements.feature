Feature: export statements

Scenario: export { a }
  Given file "a.ts" is
    """
    const a = 1;
    export { a };
    """
  And file "b.ts" is import { a } from './a';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: export { a } from file
  Given file "a.ts" is export const a = 1;
  Given file "b.ts" is
    """
    import { a } from "./a";
    export { a };
    """
  And file "c.ts" is import { a } from './b';
  When analyzing "tsconfig.json"
  Then the result is {}
