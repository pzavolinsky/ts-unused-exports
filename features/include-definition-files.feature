Feature: include definition files

Scenario: Include definition files
  Given file "exports.d.ts" is export const unused = 1;
  When analyzing "tsconfig.json"
  Then the result is { "exports.d.ts": ["unused"] }

Scenario: Do NOT include definition files
  Given file "exports.d.ts" is export const unused = 1;
  When analyzing "tsconfig.json" with files ["--excludeDeclarationFiles"]
  Then the result is {}

Scenario: Include definition files from sub-folder, without error
  Given file "x/a.d.ts" is
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
  Then the result is { "b.ts": ["a"], "x/a.d.ts": ["A_unused"] }

Scenario: Do NOT include definition files from sub-folder, without error
  Given file "x/a.d.ts" is
    """
    export type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import { A } from './x/a'
    export const a: A = 0
    """
  When analyzing "tsconfig.json" with files ["--excludeDeclarationFiles"]
  Then the result is { "b.ts": ["a"] }

Scenario: Include definition files indirectly, from sub-folder, without error
  Given file "x/a.d.ts" is
    """
    export type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import { A } from './x/a'
    export const B_a: A = 0
    export type B = 1
    export type B_unused = 2
    """
  And file "c.ts" is
    """
    import { B_a, B } from './b'
    export type C_unused = 1
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "c.ts": ["C_unused"], "x/a.d.ts": ["A_unused"] }

Scenario: Include parts of definition files indirectly, from sub-folder, without error
  Given file "x/a.d.ts" is
    """
    export type A1 = 1;
    export type A2 = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import { A1 } from './x/a'
    export type B_unused = 2
    """
  And file "c.ts" is
    """
    import { A2 } from './x/a'
    export type C_unused = 1
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "c.ts": ["C_unused"], "x/a.d.ts": ["A_unused"] }
