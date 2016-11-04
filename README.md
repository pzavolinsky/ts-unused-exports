ts-unused-exports
=================

`ts-unused-exports` finds unused exported symbols in your Typescript project.

Installation
------------

```
npm install --save-dev ts-unused-exports
```

or, to install globally:

```
npm install -g ts-unused-exports
```

Usage
-----

```shell
./node_modules/.bin/ts-unused-exports path/to/tsconfig.json [file1.ts ...]
```

or, if installed globally:

```shell
ts-unused-exports path/to/tsconfig.json [file1.ts ...]
```

or:
```ts
import analyzeTsConfig from 'ts-unused-exports';
const result = analyzeTsConfig('path/to/tsconfig.json');
// or const result = analyzeTsConfig('path/to/tsconfig.json', ['file1.ts']);

// result : { [index:string] : string[] }
// where the keys are file paths and the values are unused symbols
```

Note that if `ts-unused-exports` is called without files, the files will be read from the tsconfig's `files` key which must be present. If called with files, then those file paths should be relative to the `tsconfig.json`, just like you would specifie them in your tsconfig's `files` key.

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

`ts-unused-exports` fills this cross-module gap by complaining about exported symbols that no-one cares about.

In this sense, `ts-unused-exports` does not replace `tslint` but rather complements it by helping you detect unnecessary exports. Once those are fixed, `tslint`'s `no-unused-variable` rule will kick in and tell you which code you can safely remove.

Example
-------

There is a (very silly) example in the [example/](https://github.com/pzavolinsky/ts-unused-exports/blob/master/example) directory.

If you want to run it you can:

```shell
git clone https://github.com/pzavolinsky/ts-unused-exports
cd ts-unused-exports
./bin/ts-unused-exports example/tsconfig.json
# or: node ./bin/ts-unused-exports example/tsconfig.json
# or: node bin\ts-unused-exports example\tsconfig.json
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

If not using `files` inside your `tsconfig` (e.g. using `webpack` with `ts-loader`), you can explicitly specify the files to check in the command line:

```shell
./bin/ts-unused-exports example/tsconfig.json app.ts math.ts
```

or, in a more generic way:

```shell
./bin/ts-unused-exports example/tsconfig.json $(cd example; find -name '*.ts')
```
