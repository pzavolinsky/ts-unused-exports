"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var parser_1 = require("./parser");
var analyzer_1 = require("./analyzer");
var globFs = require("glob-fs");
var loadTsConfig = function (tsconfigPath) {
    var tsConfig = JSON.parse(fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' }));
    var files = tsConfig.files, compilerOptions = tsConfig.compilerOptions, include = tsConfig.include;
    if (!files && !include)
        throw "\n    The tsconfig does not contain a \"files\" key:\n\n      " + tsconfigPath + "\n\n    Consider either passing an explicit list of files or adding the \"files\" key.\n  ";
    if (!files && include) {
        files = include
            .filter(isGlob)
            .map(function (glob) { return globFs({}).readdirSync(glob); })
            .reduce(concatArrays, [])
            .concat(include.filter(isNotGlob))
            .filter(removeDuplicates)
            .filter(isFile);
        console.log(files);
    }
    var baseUrl = compilerOptions && compilerOptions.baseUrl;
    return { baseUrl: baseUrl, files: files };
};
exports.default = function (tsconfigPath, files) {
    var tsConfig = loadTsConfig(tsconfigPath);
    return analyzer_1.default(parser_1.default(path_1.dirname(tsconfigPath), files || tsConfig.files || [], tsConfig.baseUrl));
};
function isGlob(s) {
    return s.indexOf('*') !== -1;
}
function concatArrays(result, array) {
    return result.concat(array);
}
function isNotGlob(s) {
    return s.indexOf('*') === -1;
}
function removeDuplicates(item, index, array) {
    return array.indexOf(item) === index;
}
function isFile(path) {
    return fs_1.lstatSync(path).isFile();
}
