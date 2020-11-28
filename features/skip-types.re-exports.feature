Feature: Skip unused interface or type when re-exporting

Background:
  Given file "a.ts" is
    """
    export interface AInput {
      x: number;
      y: number;
    }

    export type AResult = number

    export const a = ({ x, y }: AInput): AResult => x + y;
    """
  And file "b/b.ts" is
    """
    export interface BInput {
      x: number;
      y: number;
    }

    export type BResult = number

    export const b = ({ x, y }: BInput): BResult => x + y;
    """
  And file "b/index.ts" is
    """
    export type { BInput, BResult } from "./b";
    export { b } from "./b";
    """

Scenario: Not skipping
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["AInput", "AResult", "a"], "b/index.ts": ["BInput", "BResult", "b"] }

Scenario: Skipping
  When analyzing "tsconfig.json" with files ["--allowUnusedTypes"]
  Then the result is { "a.ts": ["a"], "b/index.ts": ["b"] }
