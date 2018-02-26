"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var stripJsonComments = require("strip-json-comments");
var parser_1 = require("./parser");
var analyzer_1 = require("./analyzer");
var loadTsConfig = function (tsconfigPath, explicitFiles) {
    var rawTsConfig = JSON.parse(stripJsonComments(fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' })));
    var tsConfig = explicitFiles
        ? __assign({}, rawTsConfig, { files: explicitFiles }) : rawTsConfig;
    var files = tsConfig.files, compilerOptions = tsConfig.compilerOptions;
    if (!files)
        throw "\n    The tsconfig does not contain a \"files\" key:\n\n      " + tsconfigPath + "\n\n    Consider either passing an explicit list of files or adding the \"files\" key.\n  ";
    var baseUrl = compilerOptions && compilerOptions.baseUrl;
    return { baseUrl: baseUrl, files: files };
};
exports.default = (function (tsconfigPath, files) {
    var tsConfig = loadTsConfig(tsconfigPath, files);
    return analyzer_1.default(parser_1.default(path_1.dirname(tsconfigPath), tsConfig.files, tsConfig.baseUrl));
});
