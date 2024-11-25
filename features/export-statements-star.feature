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
  Then the result is { "unusedExports": { "b.ts": ["A_unused"] } }

Scenario: export * from ./a/a/a.ts
  Given file "a/a/a.ts" is
    """
    export const A = 1;
    export const A_innermost_unused = 1;
    """
  And file "a/a/index.ts" is
    """
    export * from "./a";
    """
  And file "a/a.ts" is export * from './a';
  And file "a/index.ts" is
    """
    export * from "./a";
    export const A_unused = 1;
    """
  And file "c.ts" is import { A } from './a';

  When analyzing "tsconfig.json"
  # note A_innermost_unused is not detected - that would require parsing for all usages of the namespace
  Then the result is { "unusedExports": { "a/index.ts": ["A_unused"] } }

Scenario: export * from ./a1/a2/a.ts
  Given file "a1/a2/a.ts" is
    """
    export const A = 1;
    export const A_innermost_unused = 1;
    """
  And file "a1/a2/index.ts" is
    """
    export * from "./a";
    """
  And file "a1/a.ts" is export * from './a2';
  And file "a1/index.ts" is
    """
    export * from "./a";
    export const A_unused = 1;
    """
  And file "c.ts" is import { A } from './a1';

  When analyzing "tsconfig.json"
  # note A_innermost_unused is not detected - that would require parsing for all usages of the namespace
  Then the result is { "unusedExports": { "a1/index.ts": ["A_unused"] } }

Scenario: export * from ./a1/a2/a.ts - import skipping the mid-level - import from innermost index
  Given file "a1/a2/a.ts" is
    """
    export const A = 1;
    export const A_innermost_unused = 1;
    """
  And file "a1/a2/index.ts" is
    """
    export * from "./a";
    """
  # note this IS flagged as unused
  And file "a1/a.ts" is export * from './a2';
  And file "a1/index.ts" is
    """
    // skips the mid-level file a1/a.ts
    export * from "./a1/a2";
    export const A_unused = 1;
    """
  And file "c.ts" is import { A } from './a1';

  When analyzing "tsconfig.json"
  # note A_innermost_unused is NOT detected
  Then the result is { "unusedExports": { "a1/a_ts":["* -> /a1/a2/a"], "a1/index.ts": ["A_unused"] } }

Scenario: export * from ./a1/a2/a.ts - import skipping the mid-level - import from innermost a.ts
  Given file "a1/a2/a.ts" is
    """
    export const A = 1;
    export const A_innermost_unused = 1;
    """
  # TODO this could be flagged as unused
  And file "a1/a2/index.ts" is
    """
    export * from "./a";
    """
  # TODO this could be flagged as unused
  And file "a1/a.ts" is export * from './a';
  And file "a1/index.ts" is
    """
    // skips the mid-level - imports directly from a1/a2/a.ts NOT the index, so not from an export *
    export * from "./a1/a2/a";
    export const A_unused = 1;
    """
  And file "c.ts" is import { A } from './a1';

  When analyzing "tsconfig.json"
  # note A_innermost_unused is NOT detected
  # TODO review - A is flagged via "a1/a2/index_ts":["A"...] - which is strictly correct, although could be annoying
  Then the result is { "unusedExports": { "a1/index.ts": ["A_unused"],"a1/a2/index_ts":["A","A_innermost_unused"] } }

Scenario: export * from ./a/a/a.ts - import skipping the mid-level
  Given file "a/a/a.ts" is
    """
    export const A = 1;
    export const A_innermost_unused = 1;
    """
  And file "a/a/index.ts" is
    # TODO this could be flagged as unused
    """
    export * from "./a";
    """
  And file "a/a.ts" is export * from './a';
  And file "a/index.ts" is
    """
    // skips the mid-level
    export * from "./a/a";
    export const A_unused = 1;
    """
  And file "c.ts" is import { A } from './a';

  When analyzing "tsconfig.json"
  # note A_innermost_unused IS detected
  Then the result is { "unusedExports": { "a/index.ts": ["A_unused", "A_innermost_unused"] } }

Scenario: export * from ./a/a/a.ts - import skipping the mid-level
  Given file "a/a/a.ts" is
    """
    export const A = 1;
    export const A_innermost_unused = 1;
    """
  And file "a/a/index.ts" is
    """
    export * from "./a";
    """
  # TODO this could be flagged as unused
  And file "a/a.ts" is export * from './a';
  And file "a/index.ts" is
    """
    // skips the mid-level - imports directly from a/a/a.ts NOT the index, so not from an export *
    export * from "./a/a/a";
    export const A_unused = 1;
    """
  And file "c.ts" is import { A } from './a';

  When analyzing "tsconfig.json"
  # note A_innermost_unused is NOT detected
  Then the result is { "unusedExports": { "a/index.ts": ["A_unused"] } }

Scenario: export * from ./a
  Given file "a/index.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * from './a';
  And file "c.ts" is import { A } from './b';

  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { "b.ts": ["A_unused"] } }

Scenario: export * as fromA from ./a/a.ts
  Given file "a/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a/a';
  And file "c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  # note A_unused is not detected - that would require parsing for all usages of the namespace
  Then the result is { "unusedExports": {} }

Scenario: export * as fromA from ./a/a.ts
  Given file "a/a.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a/a';
  And file "c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": { } }
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
  Then the result is { "unusedExports": {} }
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
  Then the result is { "unusedExports": {} }
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
  Then the result is { "unusedExports": {} }
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
  Then the result is { "unusedExports": {} }

Scenario: export * as fromA from ./a
  Given file "a/index.ts" is
    """
    export const A = 1;
    export const A_unused = 1;
    """
  And file "b.ts" is export * as fromA from './a';
  And file "c.ts" is import { fromA } from './b';

  When analyzing "tsconfig.json"
  Then the result is { "unusedExports": {} }
# note A_unused is not detected - that would require parsing for all usages of the namespace
