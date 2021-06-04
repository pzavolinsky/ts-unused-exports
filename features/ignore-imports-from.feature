Feature: ignoreFiles option

Background:
  Given file "a.ts" is
    """
    export function onlyUsedInTests(a, b) { return a + b; };
    export const a_unused = 1;
    """
  And file "a.test.ts" is
    """
    import {onlyUsedInTests} from "./a";
    """

Scenario: Not ignoring any files
  When analyzing "tsconfig.json"
  Then the result at a.ts is ["a_unused"]

Scenario: Ignoring test files
  When analyzing "tsconfig.json" with files ["--ignoreTestFiles"]
  Then the result at a.ts is ["onlyUsedInTests", "a_unused"]

Scenario: Ignoring test files via regex
  When analyzing "tsconfig.json" with files ["--ignoreFiles=a\\.test"]
  Then the result at a.ts is ["onlyUsedInTests", "a_unused"]

Scenario: Ignoring other files via regex
  When analyzing "tsconfig.json" with files ["--ignoreFiles=x\\.y"]
  Then the result at a.ts is ["a_unused"]

# Only evaluate *production* files (ignore all test files).
#
# This is used to find production code that is only used in tests (so is dead code).
# note: this will NOT detect unused exports in test code.
Scenario: Ignoring all test files, with test-utils files
  Given file "TestUtils.ts" is
    """
    export function helpTest() {}";

    export function unusedFromUtils() {}";
    """
  And file "b.test.ts" is
    """
    import {onlyUsedInTests} from "./a";
    import {helpTest} from "./TestUtils";

    export function unusedFromTest() {}";
    """
  When analyzing "tsconfig.json" with files ["--ignoreTestFiles"]
  Then the result is { "a.ts": ["onlyUsedInTests", "a_unused"] }

# Only evaluate *test* files (ignore all non-test files).
#
# This is used to avoid having false positives from 'test utils' code, that is not exactly a test, but is not production code.
# note: this will NOT detect unused exports in production code.
Scenario: Ignoring all non-test files, with test-utils files
  Given file "TestUtils.ts" is
    """
    export function helpTest() {}";

    export function unusedFromUtils() {}";
    """
  And file "b.test.ts" is
    """
    import {onlyUsedInTests} from "./a";
    import {helpTest} from "./TestUtils";

    export function unusedFromTest() {}";
    """
  # note: this complex regex is covered with the option --ignoreProductionFiles
  When analyzing "tsconfig.json" with files ["--ignoreFiles=^(?!.*(test|Test)).*$"]
  Then the result is { "TestUtils.ts": ["unusedFromUtils"], "b.test.ts": ["unusedFromTest"] }

# Only evaluate *test* files (ignore all non-test files).
# - using --ignoreProductionFiles
Scenario: Ignoring all non-test files, with test-utils files via ignoreProductionFiles
  Given file "TestUtils.ts" is
    """
    export function helpTest() {}";

    export function unusedFromUtils() {}";
    """
  And file "b.test.ts" is
    """
    import {onlyUsedInTests} from "./a";
    import {helpTest} from "./TestUtils";

    export function unusedFromTest() {}";
    """
  When analyzing "tsconfig.json" with files ["--ignoreProductionFiles"]
  Then the result is { "TestUtils.ts": ["unusedFromUtils"], "b.test.ts": ["unusedFromTest"] }
