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

Scenario: Include files from sub-folder, without error
  Given file "x/a.ts" is
    """
    export type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import { A } from './x/a'
    export const a: A = 0
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["a"], "x/a.ts": ["A_unused"] }

Scenario: Include re-exported types from sub-folder, without error
  Given file "x/a.ts" is
    """
    export type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import { A } from './x/a'
    export type B_unused = 2;
    export A;
    """
  And file "c.ts" is
    """
    import { A } from './b'
    export type C_unused = 2;
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "c.ts": ["C_unused"], "x/a.ts": ["A_unused"] }

Scenario: Include files indirectly from sub-folder, without error
  Given file "x/a.ts" is
    """
    export type A1 = 1;
    export type A2 = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import { A1 } from './x/a'
    export const B_a: A = 0
    export type B_unused = 2;
    """
  And file "c.ts" is
    """
    import { A2 } from './x/a'
    import { B_a } from './b'
    export type C_unused = 2;
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "c.ts": ["C_unused"], "x/a.ts": ["A_unused"] }
