Feature: baseUrl

Background:
  Given file "tsconfig.json" is
    """
    {
    // This is a comment
    "compilerOptions": { "baseUrl": "./stuff" },
    "include": ["**/*.ts", "**/*.tsx"]
    }
    """

Scenario: Import named with base url
  Given file "stuff/a.ts" is export const a = 1;
  And file "b.ts" is import { a } from 'a';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import named with base url TSX
  Given file "stuff/a.tsx" is export const a = 1;
  And file "b.ts" is import { a } from 'a';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import default with base url
  Given file "stuff/a.ts" is export default 1;
  And file "b.ts" is import a from 'a';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import default with base url TSX
  Given file "stuff/a.tsx" is export default 1;
  And file "b.ts" is import a from 'a';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Index TS
  Given file "stuff/dir/index.ts" is export default 1;
  And file "b.ts" is import a from 'dir';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Index JS
  Given file "stuff/dir/index.js" is export default 1;
  And file "b.ts" is import a from 'dir';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Index TSX
  Given file "stuff/dir/index.tsx" is export default 1;
  And file "b.ts" is import a from 'dir';
  When analyzing "tsconfig.json"
  Then the result is {}
