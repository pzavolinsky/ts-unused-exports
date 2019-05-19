ts-unused-exports-updated
=================

`ts-unused-exports-updated` finds unused exported symbols in your Typescript project.

note: this is a fork of the original `ts-unused-exports-updated` with recent PRs added.

Installation
------------

```
npm install --save-dev ts-unused-exports-updated
```

or, to install globally:

```
npm install -g ts-unused-exports-updated
```

Usage
-----

```shell
./node_modules/.bin/ts-unused-exports-updated path/to/tsconfig.json [file1.ts ...]
```

or, if installed globally:

```shell
ts-unused-exports-updated path/to/tsconfig.json [file1.ts ...]
```

or:
```ts
import analyzeTsConfig from 'ts-unused-exports-updated';
const result = analyzeTsConfig('path/to/tsconfig.json');
// or const result = analyzeTsConfig('path/to/tsconfig.json', ['file1.ts']);

// result : { [index:string] : string[] }
// where the keys are file paths and the values are unused symbols
```

Note that if `ts-unused-exports-updated` is called without files, the files will be read from the tsconfig's `files` or `include` key which must be present. If called with files, then those file paths should be relative to the `tsconfig.json`, just like you would specifie them in your tsconfig's `files` key.

`ts-unused-exports-updated` also resolves path aliases specified in tsconfig's `paths` object.

Why should I use this?
----------------------

If you've ever used `tslint`'s [no-unused-variable](http://palantir.github.io/tslint/rules/no-unused-variable/) rule you already known how awesome it is. What this rule does is detect code in your modules that is not being used so that you can remove it.

For example, say that you refactored your `math.ts` module so that you no longer use `add1`:
```ts
function add1(x:number) { return x + 1; } // warning here

export default (x:number) => x + 1;
```

When run, `tslint` will complain that `add1` is no longer in use.

Unfortunately, if your symbols are exported, `tslint` does not complain anymore. Effectively `export`ing a symbol anchors the symbol so that, even if nobody uses it, it will not be marked as dead code.

If you've ever found yourself mid-refactor fixing a  particularly fiendish function only to realize later that nobody really uses it you know exactly what I mean.

`ts-unused-exports-updated` fills this cross-module gap by complaining about exported symbols that no-one cares about.

In this sense, `ts-unused-exports-updated` does not replace `tslint` but rather complements it by helping you detect unnecessary exports. Once those are fixed, `tslint`'s `no-unused-variable` rule will kick in and tell you which code you can safely remove.

Example
-------

There is a (very silly) example in the [example/](https://github.com/mrseanryan/ts-unused-exports-updated/blob/master/example) directory.

If you want to run it you can:

```shell
git clone https://github.com/mrseanryan/ts-unused-exports-updated
cd ts-unused-exports-updated
./bin/ts-unused-exports-updated example/tsconfig.json
# or: node ./bin/ts-unused-exports-updated example/tsconfig.json
# or: node bin\ts-unused-exports-updated example\tsconfig.json
```

The output should be:
```
1 module with unused exports
math: add1
```

Also note the exit status (which equals the number of offending modules):
```shell
echo $?
# or: echo %ERRORLEVEL%
1
```

If not using `files` or `include` inside your `tsconfig` (e.g. using `webpack` with `ts-loader`), you can explicitly specify the files to check in the command line:

```shell
./bin/ts-unused-exports-updated example/tsconfig.json app.ts math.ts
```

or, in a more generic way:

```shell
./bin/ts-unused-exports-updated example/tsconfig.json $(cd example; find -name '*.ts')
```

You can use comment flags to ignore exports:

```ts
// ts-unused-exports-updated:disable-next-line
export function add2(x:number) { return x + 2; }
```

# author

Original work by *pzavolinsky* - original repo is here: [https://github.com/pzavolinsky/ts-unused-exports](https://github.com/pzavolinsky/ts-unused-exports)

# license

License is MIT.
