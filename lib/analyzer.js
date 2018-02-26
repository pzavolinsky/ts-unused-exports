"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getFileExports = function (exports) {
    var ex = {};
    exports.forEach(function (e) { return ex[e] = 0; });
    return ex;
};
var getExportMap = function (files) {
    var map = {};
    files.forEach(function (file) {
        map[file.path] = getFileExports(file.exports);
    });
    return map;
};
var processImports = function (imports, exportMap) {
    Object.keys(imports).forEach(function (key) {
        var ex = exportMap[key];
        if (!ex)
            return;
        imports[key].forEach(function (imp) {
            return imp == '*'
                ? Object.keys(ex).filter(function (e) { return e != 'default'; }).forEach(function (e) { return ++ex[e]; })
                : ++ex[imp];
        });
    });
};
var expandExportFromStar = function (files, exportMap) {
    files.forEach(function (file) {
        var fileExports = exportMap[file.path];
        file
            .exports
            .filter(function (ex) { return ex.indexOf('*:') === 0; })
            .forEach(function (ex) {
            delete fileExports[ex];
            Object.keys(exportMap[ex.slice(2)])
                .filter(function (e) { return e != 'default'; })
                .forEach(function (key) { return fileExports[key] = 0; });
        });
    });
};
exports.default = (function (files) {
    var exportMap = getExportMap(files);
    expandExportFromStar(files, exportMap);
    files.forEach(function (file) { return processImports(file.imports, exportMap); });
    var analysis = {};
    Object.keys(exportMap).forEach(function (file) {
        var ex = exportMap[file];
        var unused = Object.keys(ex).filter(function (k) { return ex[k] === 0; });
        if (unused.length)
            analysis[file] = unused;
    });
    return analysis;
});
