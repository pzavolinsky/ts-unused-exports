Feature: export * statements

Scenario: export * from ./a/a.ts
  Given file "a/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * from './a/a';
  And file "c.ts" is import { A } from './b';

  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["A_unused"] }

Scenario: export * from ./a
  Given file "a/index.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * from './a';
  And file "c.ts" is import { A } from './b';

  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["A_unused"] }

Scenario: export * as fromA from ./a/a.ts
  Given file "a/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a/a';
  And file "c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { }
# note A_unused is not detected - that would require parsing for all usages of the namespace

Scenario: export * as fromA from ./a/a.ts
  Given file "a/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a/a';
  And file "c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { }
# note A_unused is not detected - that would require parsing for all usages of the namespace

Scenario: export * as fromA from ./src/a.ts
  Given file "src/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "src/b.ts" is export * as fromA from './a';
  And file "src/c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { }
# note A_unused is not detected - that would require parsing for all usages of the namespace

Scenario: export * as fromA from ./src/a.ts
  Given file "src/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "src/b.ts" is export * as fromA from './a';
  And file "src/c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { }
# note A_unused is not detected - that would require parsing for all usages of the namespace

Scenario: export * as fromA from ./src/a.ts
  Given file "src/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "src/b.ts" is export * as fromA from './a';
  And file "c.ts" is import * as fromA2 from 'src/b';

  When analyzing "tsconfig.json"
  Then the result is { }
# note A_unused is not detected - that would require parsing for all usages of the namespace

Scenario: export * as fromA from ./a.ts
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a';
  And file "c.ts" is import * as fromA2 from './b';

  When analyzing "tsconfig.json"
  Then the result is { }

Scenario: export * as fromA from ./a
  Given file "a/index.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a';
  And file "c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { }
# note A_unused is not detected - that would require parsing for all usages of the namespace
