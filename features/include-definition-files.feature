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
    Then the result is { "b.ts": ["a"], "x/a.d.ts": ["A", "A_unused"] }

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
