Feature: include dynamic imports in a TSX file

Scenario: Dynamically import inside a div property
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <div
    a={import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    />
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import inside a div child
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <div>
    {import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    </div>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import inside a fragment child
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <>
    {import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    </>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import inside a div child, nested in fragment
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <>
    <div>
    {import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    </div>
    </>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import inside a div child, nested in div
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <div>
    <div>
    {import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    </div>
    </div>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import inside a div property, nested in div
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <div>
    <div
    a={import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    />
    </div>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import inside a div property, nested in fragment
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <>
    <div
    a={import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    />
    </>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import multiple, nested inside div or div property
  Given file "a.ts" is
    """
    export const A1 = 1;
    export const A2 = 1;
    export const A3 = 1;
    export const A4 = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    const element = (
    <>
    <div>
    <div
    a={import("./a").then(A_imported => {
    console.log(A_imported.A1);
    })}
    a2={import("./a").then(A_imported => {
    console.log(A_imported.A2);
    })}
    />
    </div>
    <div>
    <div>
    {import("./a").then(A_imported => {
    console.log(A_imported.A3);
    })}
    {import("./a").then(A_imported => {
    console.log(A_imported.A4);
    })}
    </div>
    </div>
    </>
    );
    export const B_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import multiple, nested inside div or div property - lambdas are processed independently
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.ts" is
    """
    export const A = 1; // not used
    export const B = 1;
    export const B_unused = 2;
    """
  And file "c.ts" is
    """
    export const A = 1; // not used
    export const C = 1;
    export const C_unused = 2;
    """
  And file "d.ts" is
    """
    export const A = 1; // not used
    export const D = 1;
    export const D_unused = 2;
    """
  And file "t.tsx" is
    """
    const element = (
    <>
    <div>
    <div
    a={import("./a").then(A_imported => {
    console.log(A_imported.A);
    })}
    a2={import("./b").then(A_imported => {
    console.log(A_imported.B);
    })}
    />
    </div>
    <div>
    <div>
    {import("./c").then(A_imported => {
    console.log(A_imported.C);
    })}
    {import("./d").then(A_imported => {
    console.log(A_imported.D);
    })}
    </div>
    </div>
    </>
    );
    export const T_unused = 0;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.ts": ["A", "B_unused"], "c.ts": ["A", "C_unused"], "d.ts": ["A", "D_unused"], "t.tsx": ["T_unused"] }

Scenario: Dynamically import in div inside function
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    function foo() {
    return (
    <div bar={() => {import("./a").then(a => a.A)} />
    );
    }
    export const B_unused = 3;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import in div inside function - no block on right hand side
  Given file "a.ts" is
    """
    export const A = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    function foo() {
    return (
    <div bar={() => import("./a").then(a => a.A) />
    );
    }
    export const B_unused = 3;
    """
  When analyzing "tsconfig.json"
  Then the result is { "a.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import in div inside function - real example
  Given file "./MyDynamicComponent.ts" is
    """
    export const MyDynamicMember = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    function foo() {
    return (
    <div
    onClick={() =>
    import("./MyDynamicComponent").then(m => m.MyDynamicMember)
    }
    children={{
    otherKey: 123
    }}
    />
    );
    }
    export const B_unused = 3;
    """
  When analyzing "tsconfig.json"
  Then the result is { "MyDynamicComponent.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import in div inside function - real example - with comment on the import from, and with path
  Given file "myPath/MyDynamicComponent.ts" is
    """
    export const MyDynamicMember = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    function foo() {
    return (
    <div
    onClick={() =>
    import(/* webpackChunkName: "myChunk" */ "myPath/MyDynamicComponent").then(m => m.MyDynamicMember)
    }
    children={{
    otherKey: 123
    }}
    />
    );
    }
    export const B_unused = 3;
    """
  When analyzing "tsconfig.json"
  Then the result is { "myPath/MyDynamicComponent.ts": ["A_unused"], "b.tsx": ["B_unused"] }

Scenario: Dynamically import in div inside function - real example - with import that is buried inside a 'Promise.all'
  Given file "myPath/MyDynamicComponent.ts" is
    """
    export const MyDynamicMember = 1;
    export const A_unused = 2;
    """
  And file "b.tsx" is
    """
    function foo() {
    return (
    <div
    myAttr={() =>
    Promise.all[
    import(/* webpackChunkName: "myChunk" */ "myPath/MyDynamicComponent").then(
    m => m.MyDynamicMember
    ),
    myOtherPromise
    ]}
    />
    );
    }
    export const B_unused = 3;
    """
  When analyzing "tsconfig.json"
  Then the result is { "myPath/MyDynamicComponent.ts": ["A_unused"], "b.tsx": ["B_unused"] }
