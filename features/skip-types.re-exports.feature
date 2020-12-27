Feature: Skip unused interface or type or enum when re-exporting

Background:
  Given file "a.ts" is
    """
    export interface IAInput {
    x: number;
    y: number;
    }

    export type TypeAResult = number

    export enum UnusedColorA { Red, Green, Blue};

    export const a = ({ x, y }: IAInput): TypeAResult => x + y;
    """
  And file "b/b.ts" is
    """
    export interface IBInput {
    x: number;
    y: number;
    }

    export type TypeBResult = number

    export const b = ({ x, y }: IBInput): TypeBResult => x + y;
    """
  And file "b/index.ts" is
    """
    export type { IBInput, TypeBResult } from "./b";
    export { b } from "./b";
    """

Scenario: Not skipping
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["IAInput", "TypeAResult", "UnusedColorA", "a"], "b/index.ts": ["IBInput", "TypeBResult", "b"] }

Scenario: Skipping
  When analyzing "tsconfig.json" with files ["--allowUnusedTypes"]
  Then the result is { "a.ts": ["UnusedColorA", "a"], "b/index.ts": ["b"] }

Scenario: Skipping
  When analyzing "tsconfig.json" with files ["--allowUnusedEnums"]
  Then the result is { "a.ts": ["IAInput", "TypeAResult", "a"], "b/index.ts": ["IBInput", "TypeBResult", "b"] }
