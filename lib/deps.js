"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var fs_2 = require("fs");
var path_1 = require("path");
var parser_1 = require("./parser");
var getFileMap = function (files) {
    var map = {};
    files.map(function (f) { return map[f.path] = f; });
    return map;
};
function analyzeFile(fileMap, file, analysis) {
    var existing = analysis[file.path];
    if (existing)
        return existing;
    var dep = {
        name: file.path,
        count: 1,
        depth: 1,
        dependencies: []
    };
    analysis[file.path] = dep;
    var deps = Object.keys(file.imports).map(function (d) {
        return analyzeFile(fileMap, fileMap[d], analysis);
    });
    var depth = deps.map(function (d) { return d.depth; }).reduce(function (a, b) { return Math.max(a, b); }, 0);
    var count = deps.map(function (d) { return d.count; }).reduce(function (a, b) { return a + b; }, 0);
    dep.depth = 1 + depth;
    dep.count = 1 + count;
    dep.dependencies = deps;
    return dep;
}
;
var analyzeDeps = function (tsconfigPath) {
    var files = parser_1.default(path_1.dirname(tsconfigPath), JSON.parse(fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' })).files);
    var fileMap = getFileMap(files);
    var analysis = {};
    files.forEach(function (f) { return analyzeFile(fileMap, f, analysis); });
    return analysis;
};
var _a = process.argv.slice(2), tsconfig = _a[0], filter = _a[1];
if (!tsconfig || !fs_2.existsSync(tsconfig) || !fs_2.statSync(tsconfig).isFile()) {
    console.error("usage: deps path/to/tsconfig.json [filter]");
    process.exit(-1);
}
var getValues = function (o) {
    return Object.keys(o).reduce(function (v, k) { return v.concat([o[k]]); }, []);
};
var analysis = analyzeDeps(tsconfig);
var deps = getValues(analysis);
deps.sort(function (a, b) { return a.depth - b.depth; });
console.log(deps.length + " modules found");
function dumpDep(dep, dups, padd) {
    if (dups === void 0) { dups = {}; }
    if (padd === void 0) { padd = ''; }
    var dup = dups[dep.name] ? ' [dup]' : '';
    console.log(padd + "[" + (dep.depth - 1) + "|" + (dep.count - 1) + "] " + dep.name + dup);
    return !dup;
}
;
function dumpDepRec(dep, dups, padd) {
    if (dups === void 0) { dups = {}; }
    if (padd === void 0) { padd = ''; }
    if (!dumpDep(dep, dups, padd))
        return;
    dups[dep.name] = true;
    dep.dependencies.forEach(function (d) { return dumpDepRec(d, dups, padd + "  "); });
}
;
deps.forEach(function (d) { return dumpDep(d); });
console.log(Object.keys(analysis).length + " nodes in the dependency tree");
if (filter) {
    var re_1 = new RegExp(filter, 'i');
    deps.filter(function (d) { return d.name.match(re_1); }).forEach(function (d) {
        console.log('-----------------');
        dumpDepRec(d);
    });
}
