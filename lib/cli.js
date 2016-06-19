"use strict";
var app_1 = require('./app');
var fs_1 = require('fs');
var tsconfig = process.argv.slice(2)[0];
if (!tsconfig || !fs_1.existsSync(tsconfig) || !fs_1.statSync(tsconfig).isFile()) {
    console.error("usage: ts-unused-exports path/to/tsconfig.json");
    process.exit(-1);
}
var analysis = app_1.default(tsconfig);
var files = Object.keys(analysis);
console.log(files.length + " module" + (files.length == 1 ? '' : 's') + " with unused exports");
files.forEach(function (path) { return console.log(path + ": " + analysis[path].join(', ')); });
process.exit(files.length);
