Feature: ignoreLocallyUsed option

Scenario: IgnoreLocallyUsed on
  Given file "exports.ts" is
    """
    export const a = 1;
    export const b = a + 1;
    """
  And file "import.ts" is import {b} from "./exports";
  When running ts-unused-exports "tsconfig.json" --ignoreLocallyUsed
  Then the CLI result at status is 0

Scenario: IgnoreLocallyUsed off
  Given file "exports.ts" is
    """
    export const a = 1;
    export const b = a + 1;
    """
  And file "import.ts" is import {b} from "./exports";
  When running ts-unused-exports "tsconfig.json"
  Then the CLI result at status is 1
  And the CLI result at stdout contains "exports.ts: a"

Scenario: Used locally in a namespace
  Given file "namespace.ts" is
    """
    export const a = 1;
    namespace foo {
    const b = a + 1;
    }
    """
  When running ts-unused-exports "tsconfig.json" --ignoreLocallyUsed
  Then the CLI result at status is 0

Scenario: ignoreLocallyUsed works with more complex file extensions
  Given file "local.test.ts" is
    """
    export const a = 1;
    const b = a + 1;
    """
  When running ts-unused-exports "tsconfig.json" --ignoreLocallyUsed
  Then the CLI result at status is 0

Scenario: ignoreLocallyUsed works with template literals
  Given file "local.test.ts" is
    """
    export const a = 1;
    const b = `text ${a} some more text`;
    """
  When running ts-unused-exports "tsconfig.json" --ignoreLocallyUsed
  Then the CLI result at status is 0

Scenario: ignoreLocallyUsed works with objects
  Given file "local.test.ts" is
    """
    export const a = 1;
    export const b = 2;
    const c = {
    a
    };
    c['b'] = b;
    """
  When running ts-unused-exports "tsconfig.json" --ignoreLocallyUsed
  Then the CLI result at status is 0
