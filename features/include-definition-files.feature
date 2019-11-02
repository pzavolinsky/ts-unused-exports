Feature: include definition files

Scenario: Include definition files
  Given file "exports.d.ts" is export const unused = 1;
  When analyzing "tsconfig.json" with files ["--includeDeclarationFiles"]
  Then the result is { "exports.d.ts": ["unused"] }

Scenario: Do NOT include definition files
  Given file "exports.d.ts" is export const unused = 1;
  When analyzing "tsconfig.json"
  Then the result is {} 
