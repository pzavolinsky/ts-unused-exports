Feature: absolute-paths without paths set in tsconfig

Background:
    Given file "tsconfig.json" is
        """
        {
            "baseDir": ".",
            "compilerOptions": {
                "baseUrl": "src"
            },
            "include": [
                "./src"
            ]
        }
        """

Scenario: Import component using absolute path
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

Scenario: Import component using absolute path, from sub-folder
    Given file "./src/components/MyComponent.ts" is
        """
        export class MyComponent1 {};
        export class UnusedComponent {};
        """
    And file "src/subFolder/b.ts" is
        """
        import {MyComponent1} from "components/MyComponent";
        """
    When analyzing "tsconfig.json"
    Then the result is { "src/components/MyComponent.ts": ["UnusedComponent"] }

Scenario: Import function using absolute path
    Given file "src/helpers/form/myFunctions.ts" is
        """
        export function doSomething({isTheFieldRequired} = defaultRequiredParam) {}
        export function unusedDoSomething() {}
        """
    And file "src/b.ts" is
        """
        import { doSomething } from "helpers/form/myFunctions";
        """
    When analyzing "tsconfig.json"
    Then the result is { "src/helpers/form/myFunctions.ts": ["unusedDoSomething"] }

# TODO xxx test namespace using absolute path - search ON
#   When analyzing "tsconfig.json" with files ["--searchNamespaces"]
