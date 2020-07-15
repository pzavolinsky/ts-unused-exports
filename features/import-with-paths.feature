Feature: absolute-paths without paths set in tsconfig

Background:
    Given file "tsconfig.json" is
        """
        {
            "baseDir": "src",
            "paths": {
              "components": ["src/nested/components/some"],
              "components/*": ["src/nested/components/*"]
            }
            "include": [
                "./src"
            ]
        }
        """

Scenario: Import component using path aliases for declaration files
    Given file "./src/components/MyComponent.d.ts" is
        """
        export interface MyComponent1 {};
        export interface UnusedComponent {};
        """
    And file "src/b.ts" is
        """
        import {MyComponent1} from "components/MyComponent";
        """
    When analyzing "tsconfig.json"
    Then the result is { "src/components/MyComponent.ts": ["UnusedComponent"] }

Scenario: Import component using path aliases
    Given file "./src/components/MyComponent.ts" is
        """
        export class MyComponent1 {};
        export class UnusedComponent {};
        """
    And file "src/b.ts" is
        """
        import {MyComponent1} from "components/MyComponent";
        """
    When analyzing "tsconfig.json"
    Then the result is { "src/components/MyComponent.ts": ["UnusedComponent"] }
