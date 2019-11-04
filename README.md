# ts-unused-exports [![Build Status](https://travis-ci.com/pzavolinsky/ts-unused-exports.svg?branch=master)](https://travis-ci.com/pzavolinsky/ts-unused-exports)

`ts-unused-exports` finds unused exported symbols in your Typescript project.

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
// or const result = analyzeTsConfig('path/to/tsconfig.json', ['file1.ts', '--ignorePaths=math']);

// result : { [index:string] : ExportNameAndLocation[] }
// where the keys are file paths and the values are a structure descibing unused symbols:
// interface ExportNameAndLocation {
//   exportName: string;
//   location: LocationInFile;
// }
```

Options:

| Option name      | Description                                                                  | Example                    |
| ---------------- | ---------------------------------------------------------------------------- | -------------------------- |
| `exitWithCount`  | Set the process exit code to be the count of files that have unused exports. | `--exitWithCount`          |
| `ignorePaths`    | Exclude files that match the given path segments.                            | `--ignorePaths=math;utils` |
| `showLineNumber` | Show the line number and column of the unused export.                        | `--showLineNumber`         |

Note that if `ts-unused-exports` is called without files, the files will be read from the tsconfig's `files` or `include` key which must be present. If called with files, then those file paths should be relative to the `tsconfig.json`, just like you would specif thyem in your tsconfig's `files` key.

`ts-unused-exports` also resolves path aliases specified in tsconfig's `paths` object.

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

There is a (very silly) example in the [example/](https://github.com/pzavolinsky/ts-unused-exports/blob/master/example/simple) directory.

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
/home/sean/src/github/mrseanryan/ts-unused-exports/example/simple/math.ts: add1
/home/sean/src/github/mrseanryan/ts-unused-exports/example/simple/unused.ts: unused
```

If the option `--exitWithCount` is used, then the exit status will equal the number of offending modules:

```shell
echo $?
# or: echo %ERRORLEVEL%
2
```

Normally the exit code follows the convention used by [eslint](https://eslint.org/docs/user-guide/command-line-interface):

- 0 = Linting was successful and there are no linting errors.
- 1 = Linting was successful and there is at least one linting error.
- 2 = Linting was unsuccessful due to bad arguments or an internal error.

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

# Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

`ts-unused-exports` was created by Patricio Zavolinsky. Improvements were contributed by the [open source
community](https://github.com/pzavolinsky/ts-unused-exports/graphs/contributors).

# Licence: MIT

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details
