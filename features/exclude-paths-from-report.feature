Feature: ignore paths

Scenario: Ignore all
  Given file "exports.ts" is export const a = 1;
  When analyzing "tsconfig.json" with files ["--excludePathsFromReport=exports;other-1"]
  Then the result is {}

Scenario: Ignore none
  Given file "exports.ts" is export const a = 1;
  When analyzing "tsconfig.json" with files ["--excludePathsFromReport=other-1;other-2"]
  Then the result is { "exports.ts": ["a"] }
