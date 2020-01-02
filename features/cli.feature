Feature: CLI

Scenario: Search Namespaces ON
  Given file "a.ts" is
    """
    // This is line 1
    export namespace ns
    {
    export const ns_unused = 1;
    }
    """
  And file "b.ts" is
    """
    import { ns } from './a';
    export const B_unused = 2;
    """
  When running ts-unused-exports "tsconfig.json" --searchNamespaces
  Then the CLI result at status is 1
  And the CLI result at stdout contains "a.ts: ns.ns_unused"
  And the CLI result at stdout contains "b.ts: B_unused"

Scenario: Search Namespaces ON - duplicate namespace names
  Given file "ns-a.ts" is
    """
    export namespace ns
    {
    export const ns_unused_a = 1;
    }
    """
  And file "ns-b.ts" is
    """
    // This is the same namespace name, but a different file!
    export namespace ns
    {
    export const ns_unused_b = 1;
    }
    """
  And file "c.ts" is
    """
    import { ns } from './ns-a';
    export const C_unused = 1;
    """
  When running ts-unused-exports "tsconfig.json" --searchNamespaces
  Then the CLI result at status is 1
  And the CLI result at stdout contains "ns-a.ts: ns.ns_unused_a"
  And the CLI result at stdout contains "ns-b.ts: ns, ns.ns_unused_b"

Scenario: Search Namespaces OFF
  Given file "a.ts" is
    """
    // This is line 1
    export namespace ns
    {
    export const ns_unused = 1;
    }
    export const A_unused = 2;
    """
  And file "b.ts" is
    """
    import { ns } from './a';
    export const B_unused = 2;
    """
  When running ts-unused-exports "tsconfig.json"
  Then the CLI result at status is 1
  And the CLI result at stdout contains "a.ts: A_unused"
  And the CLI result at stdout contains "b.ts: B_unused"

Scenario: Line numbers
  Given file "a.ts" is
    """
    // This is line 1
    export const a = 1; // This is line 2
    """
  When running ts-unused-exports "tsconfig.json" --showLineNumber
  Then the CLI result at status is 1
  And the CLI result at stdout contains "a.ts[2,0]: a"

Scenario: Exit with count (errors)
  Given file "a.ts" is export const a = 1;
  And file "b.ts" is export const b = 1;
  And file "c.ts" is export const c = 1;
  When running ts-unused-exports "tsconfig.json" --exitWithCount
  Then the CLI result at status is 3

Scenario: Exit with count (success)
  Given file "a.ts" is const a = 1;
  When running ts-unused-exports "tsconfig.json"
  Then the CLI result at status is 0

Scenario: Invalid tsconfig path
  When running ts-unused-exports "invalid.json"
  Then the CLI result at status is 2
  And the CLI result at stderr matches The tsconfig file .* could not be found

Scenario: Invalid tsconfig format
  Given file "invalid-tsconfig.json" is not a valid tsconfig
  When running ts-unused-exports "invalid-tsconfig.json"
  Then the CLI result at status is 2

Scenario: Invalid tsconfig schema
  Given file "invalid-tsconfig.json" is { "invalid": 1 }
  When running ts-unused-exports "invalid-tsconfig.json"
  Then the CLI result at status is 2

Scenario: No tsconfig (show usage)
  When running ts-unused-exports
  Then the CLI result at status is 2

Scenario: Invalid option
  When running ts-unused-exports "tsconfig.json" --invalid-option
  Then the CLI result at status is 2
  And the CLI result at stderr contains "Invalid options."
