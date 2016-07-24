"use strict";
var fs_1 = require('fs');
var fs_2 = require('fs');
var path_1 = require('path');
var parser_1 = require('./parser');
var getFileMap = function (files) {
    var map = {};
    files.map(function (f) { return map[f.path] = f; });
    return map;
};
function dumpFile(fileMap, file, dups, padd) {
    if (padd === void 0) { padd = ''; }
    if (dups[file.path]) {
        console.log("" + padd + file.path + " [dup]");
        return;
    }
    console.log("" + padd + file.path);
    dups[file.path] = true;
    Object.keys(file.imports).map(function (i) {
        return dumpFile(fileMap, fileMap[i], dups, padd + " ");
    });
}
;
var dumpDeps = function (tsconfigPath, moduleName) {
    var files = parser_1.default(path_1.dirname(tsconfigPath), JSON.parse(fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' })).files);
    var fileMap = getFileMap(files);
    var file = fileMap[moduleName];
    if (!file) {
        console.error("cannot find '" + moduleName + "', valid modules are:\n" + files.map(function (f) { return ("  - " + f.path); }).join('\n'));
        process.exit(-1);
    }
    var dups = {};
    dumpFile(fileMap, file, dups);
    console.log(Object.keys(dups).length + " nodes in the dependency tree");
};
var args = process.argv.slice(2);
var tsconfig = args[0], file = args[1];
if (!tsconfig || !fs_2.existsSync(tsconfig) || !fs_2.statSync(tsconfig).isFile()) {
    console.error("usage: deps path/to/tsconfig.json path/to/module");
    process.exit(-1);
}
dumpDeps(tsconfig, file);
