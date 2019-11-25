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
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["constants", "constants.flag", "A_unused"] }

Scenario: Import namespace only
  Given file "b.ts" is import { A, constants } from './a';
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["constants.flag", "A_unused"] }

Scenario: Import namespace and use the inner type
  Given file "b.ts" is
    """
    import { A, constants } from './a';

    const b: constants.flag;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"] }

# TODO xxx nested namespace tests (separate file, with nested setup)
