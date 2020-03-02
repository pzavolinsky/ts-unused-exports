Feature: include dynamic imports

Scenario: Include dynamic import as promise
  Given file "a.ts" is
    """
    export default type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    import("./a").then(A_imported => {
    console.log(A_imported);
    });
    export const B_unused: A = 0
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "a.ts": ["A_unused"] }

Scenario: Include dynamic import as promise - in a function
  Given file "a.ts" is
    """
    export default type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    function imports() {
    import("./a").then(A_imported => {
    console.log(A_imported);
    });
    }
    export const B_unused: A = 0
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "a.ts": ["A_unused"] }

Scenario: Include dynamic import via await - in a function
  Given file "a.ts" is
    """
    export default type A = 1;
    export type A_unused = 2;
    """
  And file "b.ts" is
    """
    async function imports() {
    const A_imported = await import("./a");
    console.log(A_imported);
    }
    export const B_unused: A = 0
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "a.ts": ["A_unused"] }

Scenario: Dynamically import default function
  Given file "a.ts" is
    """
    export default function iAmDefault() { return 2; };
    """
  And file "b.ts" is
    """
    import("./a").then(A_imported => {
    console.log(A_imported);
    });
    export const B_unused: A = 0
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"] }

Scenario: Dynamically import with dereference
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.ts" is
    """
    import("./a").then(A_imported => {
    console.log(A_imported.A);
    });
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "b.ts": ["B_unused"], "a.ts": ["A_unused"] }
