"use strict";
var fs_1 = require("fs");
var path_1 = require("path");
var parser_1 = require("./parser");
var analyzer_1 = require("./analyzer");
var loadTsConfig = function (tsconfigPath) {
    var files = JSON.parse(fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' })).files;
    if (!files)
        throw "\n    The tsconfig does not contain a \"files\" key:\n\n      " + tsconfigPath + "\n\n    Consider either passing an explicit list of files or adding the \"files\" key.\n  ";
    return files;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (tsconfigPath, files) {
    return analyzer_1.default(parser_1.default(path_1.dirname(tsconfigPath), files || loadTsConfig(tsconfigPath)));
};
