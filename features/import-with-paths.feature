Feature: absolute-paths without paths set in tsconfig

Background:
    Given file "tsconfig.json" is
        """
        {
            "baseDir": ".",
            "compilerOptions": {
              "paths": {
                "components": ["src/nested/components"],
                "components/*": ["src/nested/components/*"]
              }
            },
            "include": [
                "./src"
            ]
        }
        """

Scenario: Import component using path aliases for declaration files
    Given file "./src/nested/components/MyComponent.d.ts" is
        """
        export interface MyComponent1 {};
        export interface UnusedComponent {};
        """
    And file "src/b.ts" is
        """
        import {MyComponent1} from "components/MyComponent";
        """
    When analyzing "tsconfig.json"
    Then the result is { "src/nested/components/MyComponent.d.ts": ["UnusedComponent"] }

Scenario: Import component using path aliases
    Given file "./src/nested/components/MyComponent.ts" is
        """
        export class MyComponent1 {};
        export class UnusedComponent {};
        """
    And file "src/b.ts" is
        """
        import {MyComponent1} from "components/MyComponent";
        """
    When analyzing "tsconfig.json"
    Then the result is { "src/nested/components/MyComponent.ts": ["UnusedComponent"] }
