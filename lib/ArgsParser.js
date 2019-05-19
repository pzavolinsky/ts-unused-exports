"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function extractOptionsFromFiles(files) {
    var filesAndOptions = {
        tsFiles: undefined,
        options: {}
    };
    var isOption = function (opt) {
        return opt.indexOf("--") === 0;
    };
    if (files) {
        var options = files.filter(function (f) { return isOption(f); });
        filesAndOptions.tsFiles = files.filter(function (f) { return !isOption(f); });
        return processOptions(filesAndOptions, options);
    }
    return filesAndOptions;
}
function processOptions(filesAndOptions, options) {
    var newFilesAndOptions = {
        options: {
            pathsToIgnore: []
        },
        tsFiles: filesAndOptions.tsFiles
    };
    options.forEach(function (option) {
        var parts = option.split("=");
        var optionName = parts[0];
        var optionValue = parts[1];
        switch (optionName) {
            case "--ignorePaths":
                {
                    var paths = optionValue.split(";");
                    paths.forEach(function (path) {
                        newFilesAndOptions.options.pathsToIgnore.push(path);
                    });
                }
                break;
            default:
                throw new Error("Not a recognised option '" + optionName + "'");
        }
    });
    return newFilesAndOptions;
}
exports.default = (function (files) {
    return extractOptionsFromFiles(files);
});
