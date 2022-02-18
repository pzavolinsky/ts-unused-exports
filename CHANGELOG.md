## [8.0.0] - 14 Feb 2022

### Changed

- Fix: Add support for 'extends' in tsconfig.json (Issue #102, #200)
- (Internal) Using absolute paths which is less ambiguous. Delegating tsconfig.json parsing to TypeScript.

## [7.0.3] - 25 Feb 2021

### Changed

- Package metadata related to funding and financial support, no functional or implementation changes.

## [7.0.2] - 23 Feb 2021

### Changed

- Fix false positives on Windows machines when using absolute paths (baseUrl) or aliases (paths).

## [7.0.1] - 18 Jan 2021`

### Changed

- Updated the chalk dependency (no change in behavior)
- (Internal) Updated the dev dependencies, involving lot of small changes adding parentheses to lambda parameters.
- Fix --allowUnusedTypes not applying to type re-exports (Issue #180)
- Fix --allowUnusedEnums not applying to enum re-exports

## [7.0.0] - 11 Nov 2020

### Changed

- BREAKING CHANGE: Makes TypeScript a peer dependency (Issue #159)  
  Migration path:
  If you already have a version of the TypeScript compiler installed in the same spot as ts-unused-exports no migration steps are necessary (it will work out of the box).
  Otherwise you'll have to install the TypeScript compiler there yourself (e.g. with `npm i -D typescript`).
- Fixed false positive with path aliases and sub-folders (Issue #154)
- Improved support for export * as (Issue #160)

## [6.3.0] - 11 Nov 2020

### Added

- Add option 'exitWithUnusedTypesCount' to exit with a number indicating the total count of unused types. (Issue #172)
- Add option 'allowUnusedEnums' to skip unused enums. (Issue #165). Also fixes bug where option 'allowUnusedTypes' also turned on option 'excludeDeclarationFiles'.

### Changed

- if 0 issues (0 modules with unused exports) then use the default color. (Issue #164)
- Add an option to stop writing to stdout on success: --silent

## [6.2.4] - 14 Sep 2020

### Changed

- Dependency: update `node-fetch`.

## [6.2.3] - 27 Aug 2020

### Changed

- Fix: false positives if importing from a d.ts file, and tsconfig is set to use aliases (paths).

## [6.2.2] - 25 Aug 2020

### Changed

- Fix: when dynamic import has curly braces around parameter
- Fix: false positives if importing from a d.ts file, and tsconfig is set to use either absolute paths (baseUrl) or aliases (paths).

## [6.2.1] - 1 Jun 2020

### Changed

- Fix: Dynamically import with destructuring and less whitespace
- Fix: Dynamically import to a promise (Issue #139)
- Fix: Dynamically import with lambda inside div (Issue #140)
- (Internal) Add dynamic import tests involving ternary operator

## [6.2.0] - 11 May 2020

### Changed

- (Internal) Using TypeScript 3.8

### Added

- Handle dynamic imports within a TSX div or fragment
- Add basic support for export \* as namespace.

## [6.1.2] - 1 Apr 2020

### Changed

- Fix to make the exports analyzer more robust

## [6.1.1] - 22 Mar 2020

### Changed

- Fix to support destructured exports with renaming, like 'export const { a: a2 }'
- Fix: Dynamic import with destructuring and renaming
- Fix: Do not classify other lambdas as using a dynamic import
- Fix: Include methods when searching for dynamic imports

## [6.1.0] - 4 Mar 2020

### Added

- Add an option to allow maximum number of issues: --maxIssues

### Changed

- Fix to support destructuerd exports like 'export const { a, b }'
- Handle dynamic imports that use dereferencing

## [6.0.0] - 24 Jan 2020

### Added

- Add options to ignore imports from certain files: --ignoreFiles, --ignoreProductionFiles, --ignoreTestFiles

### Changed

- BREAKING CHANGE: renamed the option --ignorePaths to be --excludePathsFromReport

## [5.5.0] - 20 Jan 2020

### Added

- Add option --allowUnusedTypes to skip unused types or interfaces.

## [5.4.0] - 19 Jan 2020

### Added

- Support exports destructured from array (issue #31)

## [5.3.0] - 04 Jan 2020

### Added

- Handle exports from within a namespace. Disabled by default, unless option --searchNamespaces is given. Note: this can affect performance on large codebases.

## [5.2.0] - 23 Dec 2019

### Changed

- (Internal) Update dependency TypeScript to 3.7.3
- (Internal) Simplify some logic, using the new optional chaining operator (?.)
- (Internal) Increase code coverage and simplify code (baseUrl defaults to '.')

## [5.1.0] - 26 Nov 2019

### Added

- Detect dynamic imports, to avoid false reports of unused exports
- Handle the alias from 'export default as', to avoid false positives.

### Changed

- (Internal) Update dependencies (except for TypeScript)

## [5.0.0] - 22 Nov 2019

### Added

- Include `.d.ts` files when searching for unused exports. This can be disabled via the --excludeDeclarationFiles option.

## [4.0.0] - 07 Nov 2019

### Changed

- use eslint-style exit code (0 = no issues, 1 = unused exports found, 2 = exception occurred)
- (Internal) add code coverage via nyc
- (Internal) code coverage and linting are included in `npm test`
- (Internal) add more unit tests, increasing the code coverage
- Limit max exit code when --exitWithCount option is used (max is 127, a signed byte)
- (Internal) add badges including: code coverage, npm package version, license, dependency status.

## [3.0.3] - 30 Oct 2019

### Changed

- (Internal) Add eslint with default rules (via typescript-eslint)
- (Internal) Fix all the linting issues

## [3.0.2] - 28 Oct 2019

### Changed

- (Internal) Replaced jasmine tests with cucumber tests
- Fix handling of import from index files, like "." or "./index.ts"

## [3.0.1] - 28 Oct 2019

### Changed

- Fix bug introduced by --showLineNumber option, where analysis throws error on more complex projects.

## [3.0.0] - 27 Oct 2019

### Changed

- Updated TypeScript dependency to 3.6.4

## [2.2.0] - 27 Oct 2019

### Added

- If the option --showLineNumber is given, then output 1 line per unused export, with the location in the file (line number, column)

### Changed

- Fix the --ignorePaths option (it was incorrectly filtering the parsed files, instead of filtering the output)

## [2.1.0] - 20 Oct 2019

### Added

- Add comment flag to ignore some exports
- Add tsconfig paths aliases support
- Remove recursive imports check (performance on big projects)
- Use tsconfig 'paths' to resolve import paths
- Print full paths in console, with color highlighting
- Add cmd line option to ignore results from some file paths

### Changed

- By default, the process exit code will be 0 unless there was a critical error (bad arguments or a missing file)
- If the option --exitWithCount is given, then return the count of files that have unused exports
