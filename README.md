# ts-unused-exports

`ts-unused-exports` finds unused exported symbols in your Typescript project.

[![Build Status](https://travis-ci.com/pzavolinsky/ts-unused-exports.svg?branch=master)](https://travis-ci.com/pzavolinsky/ts-unused-exports)
[![Coveralls](https://img.shields.io/coveralls/pzavolinsky/ts-unused-exports.svg)](https://coveralls.io/github/pzavolinsky/ts-unused-exports)

[![npm Package](https://img.shields.io/npm/v/ts-unused-exports.svg?style=flat-square)](https://www.npmjs.org/package/ts-unused-exports)
[![NPM Downloads](https://img.shields.io/npm/dm/ts-unused-exports.svg)](https://npmjs.org/package/ts-unused-exports)

[![Dependencies](https://david-dm.org/pzavolinsky/ts-unused-exports.svg)](https://david-dm.org/pzavolinsky/ts-unused-exports)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z13CHUI)

## Installation

```
npm install --save-dev ts-unused-exports
```

or, to install globally:

```
npm install -g ts-unused-exports
```

## Usage

```shell
./node_modules/.bin/ts-unused-exports path/to/tsconfig.json [file1.ts ...] [options]
```

or, if installed globally:

```shell
ts-unused-exports path/to/tsconfig.json [file1.ts ...] [options]
```

or, as a library:

```ts
import analyzeTsConfig from 'ts-unused-exports';
const result = analyzeTsConfig('path/to/tsconfig.json');
// or const result = analyzeTsConfig('path/to/tsconfig.json', ['file1.ts']);
// or const result = analyzeTsConfig('path/to/tsconfig.json', ['file1.ts', '--excludePathsFromReport=math']);

// result : { [index:string] : ExportNameAndLocation[] }
// where the keys are file paths and the values are a structure descibing unused symbols:
// interface ExportNameAndLocation {
//   exportName: string;
//   location: LocationInFile;
// }
```

Options:

| Option name                | Description                                                                                                                                                                                                                                                                                                                                            | Example                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `allowUnusedEnums`         | Allow unused `enum`s.                                                                                                                                                                                                                                                                                                                                  | `--allowUnusedEnums`                  |
| `allowUnusedTypes`         | Allow unused `type` or `interface`.                                                                                                                                                                                                                                                                                                                    | `--allowUnusedTypes`                  |
| `excludeDeclarationFiles`  | Exclude `.d.ts` files when looking for unused exports.                                                                                                                                                                                                                                                                                                 | `--excludeDeclarationFiles`           |
| `maxIssues`                | Return successfully for up to a given number of modules with unused exports.                                                                                                                                                                                                                                                                           | `--maxIssues=7`                       |
| `exitWithCount`            | Set the process exit code to be the count of files that have unused exports.                                                                                                                                                                                                                                                                           | `--exitWithCount`                     |
| `exitWithUnusedTypesCount` | Set the process exit code to be the total count of unused exported types.                                                                                                                                                                                                                                                                              | `--exitWithUnusedTypesCount`          |
| `ignoreFiles`              | Ignore files with filenames that match the given regex. Use this to exclude groups of files - for example test files and their utilities.                                                                                                                                                                                                              | `--ignoreFiles=.*spec`                |
| `ignoreProductionFiles`    | Only scan **test** files (so ignore non-test 'production' files).                                                                                                                                                                                                                                                                                      | `--ignoreProductionFiles`             |
| `ignoreTestFiles`          | Only scan **production** files (ignore all test files, like `spec.ts(x)` or `test.ts(x)` or `TestUtils.ts`). Use this to detect production code that is only used in tests (so is dead code). Note: this will NOT detect unused exports in test code - for that, you can run `ts-unused-exports` separately with the `--ignoreProductionFiles` option. | `--ignoreTestFiles`                   |
| `excludePathsFromReport`   | Exclude files from the _output_ that match the given path segments.                                                                                                                                                                                                                                                                                    | `--excludePathsFromReport=math;utils` |
| `searchNamespaces`         | Enable searching for unused exports within namespaces. Note: this can affect performance on large codebases.                                                                                                                                                                                                                                           | `--searchNamespaces`                  |
| `showLineNumber`           | Show the line number and column of the unused export.                                                                                                                                                                                                                                                                                                  | `--showLineNumber`                    |
| `silent`                   | Don't write on stdout on success.                                                                                                                                                                                                                                                                                                                      | `--silent`                            |

Note that if `ts-unused-exports` is called without files, the files will be read from the tsconfig's `files` or `include` key which must be present. If called with files, then those file paths should be relative to the `tsconfig.json`, just like you would specify them in your tsconfig's `files` key.

`ts-unused-exports` also resolves path aliases specified in tsconfig's `paths` object.

As of version 7.0.0 the TypeScript compiler is a _peer dependency_ of `ts-unused-exports`. This means that if the TypeScript compiler is not already in the same spot as `ts-unused-exports`, you have to install it yourself (e.g. with `npm i -D typescript`).

## Why should I use this?

If you've ever used `tslint`'s [no-unused-variable](http://palantir.github.io/tslint/rules/no-unused-variable/) rule you already known how awesome it is. What this rule does is detect code in your modules that is not being used so that you can remove it.

For example, say that you refactored your `math.ts` module so that you no longer use `add1`:

```ts
function add1(x: number) {
  return x + 1;
} // warning here

export default (x: number) => x + 1;
```

When run, `tslint` will complain that `add1` is no longer in use.

Unfortunately, if your symbols are exported, `tslint` does not complain anymore. Effectively `export`ing a symbol anchors the symbol so that, even if nobody uses it, it will not be marked as dead code.

If you've ever found yourself mid-refactor fixing a particularly fiendish function only to realize later that nobody really uses it you know exactly what I mean.

`ts-unused-exports` fills this cross-module gap by complaining about exported symbols that no-one cares about.

In this sense, `ts-unused-exports` does not replace `tslint` but rather complements it by helping you detect unnecessary exports. Once those are fixed, `tslint`'s `no-unused-variable` rule will kick in and tell you which code you can safely remove.

## Example

There is a (very silly) example in the [example/simple](https://github.com/pzavolinsky/ts-unused-exports/blob/master/example/simple) directory.

If you want to run it you can:

```shell
git clone https://github.com/pzavolinsky/ts-unused-exports
cd ts-unused-exports
./bin/ts-unused-exports example/simple/tsconfig.json
# or: node ./bin/ts-unused-exports example/simple/tsconfig.json
# or: node bin\ts-unused-exports example\simple\tsconfig.json
```

The output should be:

```
2 modules with unused exports
/home/stuff/src/github/ts-unused-exports/example/simple/math.ts: add1
/home/stuff/src/github/ts-unused-exports/example/simple/unused.ts: unused
```

## Exit Code

Normally, the exit code follows the convention used by [eslint](https://eslint.org/docs/user-guide/command-line-interface):

- 0 = Linting was successful and there are no linting errors.
- 1 = Linting was successful and there is at least one linting error.
- 2 = Linting was unsuccessful due to bad arguments or an internal error.

If the option `--maxIssues=n` is used, then linting is considered successful, if at most n issues are found.

If the option `--exitWithCount` is used, then the exit status will equal the number of offending modules:

```shell
echo $?
# or: echo %ERRORLEVEL%
2
```

Similarly, the option `--exitWithUnusedTypesCount` means that the exit status will equal the number of offending types.

## Specifying which TypeScript files to check

If not using `files` or `include` inside your `tsconfig` (e.g. using `webpack` with `ts-loader`), you can explicitly specify the files to check in the command line:

```shell
./bin/ts-unused-exports example/simple/tsconfig.json app.ts math.ts
```

or, in a more generic way:

```shell
./bin/ts-unused-exports example/simple/tsconfig.json $(cd example/simple; find -name '*.ts')
```

You can use comment flags to ignore exports:

```ts
// ts-unused-exports:disable-next-line
export function add2(x: number) {
  return x + 2;
}
```

## Tools

Here are some tools that can be used with `ts-unused-exports`. note: these tools are separate, external projects, and we are not the maintainers. So, if you have feedback or issues with these tools, please first check in with the tool authors.

| Tool                                                                    | Description                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [eslint plugin](https://github.com/wcandillon/eslint-plugin-ts-exports) | An eslint plugin that executes `ts-unused-exports` over your code. |

## Changelog (Release History)

To see what has changed in each version, please see our [CHANGELOG.md](https://github.com/pzavolinsky/ts-unused-exports/blob/master/CHANGELOG.md).

## Contributing

`ts-unused-exports` is maintained by volunteers, working in their free time. If you'd like to help out, please see [CONTRIBUTING.md](https://github.com/pzavolinsky/ts-unused-exports/blob/master/CONTRIBUTING.md).

`ts-unused-exports` was created by Patricio Zavolinsky. Improvements were contributed by the [open source
community](https://github.com/pzavolinsky/ts-unused-exports/graphs/contributors).

## Licence: MIT

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details
