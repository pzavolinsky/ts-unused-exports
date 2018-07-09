"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var ts = require("typescript");
var path_1 = require("path");
var parser_1 = require("./parser");
var analyzer_1 = require("./analyzer");
var parseTsConfig = function (tsconfigPath) {
    var basePath = path_1.resolve(path_1.dirname(tsconfigPath));
    try {
        var parseJsonResult = ts.parseConfigFileTextToJson(tsconfigPath, fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' }));
        if (parseJsonResult.error)
            throw parseJsonResult.error;
        var result = ts.parseJsonConfigFileContent(parseJsonResult.config, ts.sys, basePath);
        if (result.errors.length)
            throw result.errors;
        return {
            baseUrl: result.raw
                && result.raw.compilerOptions
                && result.raw.compilerOptions.baseUrl,
            files: result.fileNames,
        };
    }
    catch (e) {
        throw "\n    Cannot parse '" + tsconfigPath + "'.\n\n    " + JSON.stringify(e) + "\n  ";
    }
};
var loadTsConfig = function (tsconfigPath, explicitFiles) {
    var _a = parseTsConfig(tsconfigPath), baseUrl = _a.baseUrl, files = _a.files;
    return { baseUrl: baseUrl, files: explicitFiles || files };
};
exports.default = (function (tsconfigPath, files) {
    var tsConfig = loadTsConfig(tsconfigPath, files);
    return analyzer_1.default(parser_1.default(path_1.dirname(tsconfigPath), tsConfig.files, tsConfig.baseUrl));
});
