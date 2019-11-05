Feature: directory indices

Scenario: Import '.'
  Given file "index.ts" is export const a = 1;
  And file "a.ts" is import { a } from '.';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import '.' TSX
  Given file "index.tsx" is export const a = 1;
  And file "a.ts" is import { a } from '.';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import './index'
  Given file "index.ts" is export const a = 1;
  And file "a.ts" is import { a } from './index';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import './index' TSX
  Given file "index.tsx" is export const a = 1;
  And file "a.ts" is import { a } from './index';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import directory index
  Given file "stuff/index.ts" is export const a = 1;
  And file "a.ts" is import { a } from './stuff';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import directory index TSX
  Given file "stuff/index.tsx" is export const a = 1;
  And file "a.ts" is import { a } from './stuff';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import '.' in subdir
  Given file "stuff/index.ts" is export const a = 1;
  And file "stuff/a.ts" is import { a } from '.';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import '.' in subdir TSX'
  Given file "stuff/index.tsx" is export const a = 1;
  And file "stuff/a.ts" is import { a } from '.';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import './stuff/index'
  Given file "stuff/index.ts" is export const a = 1;
  And file "stuff/a.ts" is import { a } from './index';
  When analyzing "tsconfig.json"
  Then the result is {}

Scenario: Import './stuff/index' TSX
  Given file "stuff/index.tsx" is export const a = 1;
  And file "stuff/a.ts" is import { a } from './index';
  When analyzing "tsconfig.json"
  Then the result is {}
