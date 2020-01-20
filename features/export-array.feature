Feature: export array

Scenario: export simple array
  Given file "a.ts" is
    """
    export const [x, y, z, unused] = [1, 2, 3, 'unused'];
    """
  And file "b.ts" is
    """
    import { x, y, z } from './a';
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["unused"] }

Scenario: export simple array, with alias
  Given file "a.ts" is
    """
    export const [x, y, z, unused] = [1, 2, 3, 'unused'];
    """
  And file "b.ts" is
    """
    import { x as x1, y, z } from './a';
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["unused"] }
