Feature: export namespace

Background:
  Given file "a.ts" is
    """
    export namespace constants {
    export enum flag {
    int: "int"
    }
    }

    export const A = 1;
    export const A_unused = 1;
    """

Scenario: Import A only
  Given file "b.ts" is import { A } from './a';
  When analyzing "tsconfig.json" with files ["--searchNamespaces"]
  Then the result is { "a.ts": ["constants", "constants.flag", "A_unused"] }

Scenario: Import namespace only
  Given file "b.ts" is import { A, constants } from './a';
  When analyzing "tsconfig.json" with files ["--searchNamespaces"]
  Then the result is { "a.ts": ["constants.flag", "A_unused"] }

Scenario: Import namespace and use the inner type
  Given file "b.ts" is
    """
    import { A, constants } from './a';

    const b: constants.flag;
    """
  When analyzing "tsconfig.json" with files ["--searchNamespaces"]
  Then the result is { "a.ts": ["A_unused"] }

Scenario: Import from nested namespace and use the inner type
  Given file "b.ts" is
    """
    import { A, constants } from './a';

    export namespace B_top
    {
    export const B_inner_1 = 1;

    export namespace B_inner
    {
    export const B_inner_2 = 1;
    export const B_inner_unused = 1;
    }

    export namespace B_unused
    {
    export type B_unused_unused = {};
    }
    }

    const b: constants.flag;
    """
  And file "c.ts" is
    """
    import { B_top } from './b';

    const c1: B_top.B_inner_1;
    const c2: B_top.B_inner.B_inner_2;
    """
  When analyzing "tsconfig.json" with files ["--searchNamespaces"]
  Then the result is { "a.ts": ["A_unused"], "b.ts": [ "B_top.B_inner.B_inner_unused", "B_top.B_unused", "B_top.B_unused.B_unused_unused"] }
