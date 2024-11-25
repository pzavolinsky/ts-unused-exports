Feature: paths with custom alias and long path

Background:
    Given file "tsconfig.json" is
        """
        {
            "compilerOptions": {
                "module": "commonjs",
                "esModuleInterop": true,
                "target": "es6",
                "noImplicitAny": true,
                "moduleResolution": "node",
                "sourceMap": true,
                "outDir": "dist",
                "baseUrl": "src",
                "paths": {
                    "#customAlias/*": [
                        "very/long/path/to/file/*"
                    ]
                },
                "plugins": [
                    {
                        "transform": "typescript-transform-paths"
                    }
                ],
                "types": [
                    "node"
                ]
            },
            "include": [
                "src/**/*"
            ]
        }
        """

Scenario: Import from long path both directly and via alias
    Given file "src/very/long/path/to/file/helpers.ts" is
        """
        export function sayHelloWorld(){
        console.log("Hello World")
        }

        export function sayHelloWorldInJapanese(){
        console.log("こんにちは世界")
        }

        export const unused1 = 1;
        """
    And file "src/main.ts" is
        """
        import { sayHelloWorld } from "./very/long/path/to/file/helpers";
        import { sayHelloWorldInJapanese } from "#customAlias/helpers";

        sayHelloWorld();
        sayHelloWorldInJapanese();

        export const unused2 = 1;
        """
    When analyzing "tsconfig.json"
    Then the result is { "unusedExports": { "src/main_ts":["unused2"],"src/very/long/path/to/file/helpers_ts":["unused1"]} }
