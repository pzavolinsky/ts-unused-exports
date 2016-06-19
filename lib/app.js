"use strict";
var fs_1 = require('fs');
var path_1 = require('path');
var parser_1 = require('./parser');
var analyzer_1 = require('./analyzer');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (tsconfigPath) {
    return analyzer_1.default(parser_1.default(path_1.dirname(tsconfigPath), JSON.parse(fs_1.readFileSync(tsconfigPath, { encoding: 'utf8' })).files));
};
