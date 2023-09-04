Feature: ignore paths

Scenario: Ignore all
  Given file "exports.ts" is export const a = 1;
  When analyzing "tsconfig.json" with files ["--excludePathsFromReport=exports;other-1"]
  Then the result is {}

Scenario: Ignore all using regex
  Given file "test/a.ts" is export const a = 1;
  And file "test/b.ts" is export const b = 1;
  And file "test/c.ts" is export const c = 1;
  When analyzing "tsconfig.json" with files ["--excludePathsFromReport=test\/(a|b)"]
  Then the result is { "test/c.ts": ["c"] }

Scenario: Ignore none
  Given file "exports.ts" is export const a = 1;
  When analyzing "tsconfig.json" with files ["--excludePathsFromReport=other-1;other-2"]
  Then the result is { "exports.ts": ["a"] }

Scenario: Extra semi-colons doesn't filter all results
  Given file "exports.ts" is export const a = 1;
  When analyzing "tsconfig.json" with files ["--excludePathsFromReport=other-1;;other-2;"]
  Then the result is { "exports.ts": ["a"] }