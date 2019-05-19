import { ExtraCommandLineOptions } from "./types";

export type TsFilesAndOptions = {
  tsFiles?: string[];
  options: ExtraCommandLineOptions;
};

function extractOptionsFromFiles(files?: string[]): TsFilesAndOptions {
    const filesAndOptions: TsFilesAndOptions = {
        tsFiles: undefined,
        options: {}
    };

    const isOption = (opt: string): boolean => {
        return opt.indexOf("--") === 0;
    };

    if (files) {
        const options = files.filter(f => isOption(f));
        filesAndOptions.tsFiles = files.filter(f => !isOption(f));

        return processOptions(filesAndOptions, options);
    }

    return filesAndOptions;
}

function processOptions(
    filesAndOptions: TsFilesAndOptions,
    options: string[]
): TsFilesAndOptions {
    const newFilesAndOptions: TsFilesAndOptions = {
        options: {
        pathsToIgnore: []
    },
    tsFiles: filesAndOptions.tsFiles
    };

options.forEach(option => {
    const parts = option.split("=");
    const optionName = parts[0];
    const optionValue = parts[1];

    switch (optionName) {
    case "--ignorePaths":
        {
        const paths = optionValue.split(";");
        paths.forEach(path => {
            newFilesAndOptions.options.pathsToIgnore!.push(path);
        });
        }
        break;
    default:
        throw new Error(`Not a recognised option '${optionName}'`);
    }
});

return newFilesAndOptions;
}

export default (files?:string[]): TsFilesAndOptions => {
    return extractOptionsFromFiles(files);
};  
