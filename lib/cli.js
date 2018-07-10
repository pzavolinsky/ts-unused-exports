"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("./app");
var fs_1 = require("fs");
var _a = process.argv.slice(2), tsconfig = _a[0], tsFiles = _a.slice(1);
if (!tsconfig || !fs_1.existsSync(tsconfig) || !fs_1.statSync(tsconfig).isFile()) {
    console.error("\n  usage: ts-unused-exports path/to/tsconfig.json [file1.ts file2.ts]\n\n  Note: if no file is specified after tsconfig, the files will be read from the\n  tsconfig's \"files\" key which must be present.\n\n  If the files are specified, their path must be relative to the tsconfig file.\n  For example, given:\n    /\n    |-- config\n    |    -- tsconfig.json\n    -- src\n         -- file.ts\n\n  Then the usage would be:\n    ts-unused-exports config/tsconfig.json ../src/file.ts\n  ");
    process.exit(-1);
}
try {
    var analysis_1 = app_1.default(tsconfig, tsFiles.length
        ? tsFiles
        : undefined);
    var files = Object.keys(analysis_1);
    console.log(files.length + " module" + (files.length == 1 ? '' : 's') + " with unused exports");
    files.forEach(function (path) { return console.log(path + ": " + analysis_1[path].join(', ')); });
    process.exit(Math.min(255, files.length));
}
catch (e) {
    console.error(e);
    process.exit(-1);
}
