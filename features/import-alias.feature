Feature: import alias

Scenario: One unused export const
  Given file "a.ts" is
    """
    export const a = 1;
    export const unused_a = 1;
    """
  And file "b.ts" is import { a as a1 } from './a';
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["unused_a"]

Scenario: Used export default - import * as x
  Given file "a.ts" is export default 1;
  And file "b.ts" is import * as ax from './a';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }
# see star.feature - Import * does NOT mark 'default' as unused

Scenario: Used export default - import x
  Given file "a.ts" is export default 1;
  And file "b.ts" is import x from './a';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }

Scenario: Export { symbol as x } from
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is export { a as a1 } from './a';
  And file "c.ts" is import { a1 as a2 } from './b';
  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }
