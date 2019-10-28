import { existsSync, statSync } from 'fs';

import { ExtraCommandLineOptions } from './types';

type TsFilesAndOptions = {
  tsFiles?: string[];
  options?: ExtraCommandLineOptions;
};

function processOptions(filesAndOptions: TsFilesAndOptions, options: string[]): TsFilesAndOptions {
  const pathsToIgnore: string[] = [];
  const newOptions: ExtraCommandLineOptions = {
    pathsToIgnore: pathsToIgnore,
  };
  const newFilesAndOptions: TsFilesAndOptions = {
    options: newOptions,
    tsFiles: filesAndOptions.tsFiles,
  };

  options.forEach(option => {
    const parts = option.split('=');
    const optionName = parts[0];
    const optionValue = parts[1];

    switch (optionName) {
      case '--exitWithCount':
        newOptions.exitWithCount = true;
        break;
      case '--ignorePaths':
        {
          const paths = optionValue.split(';');
          paths.forEach(path => {
            pathsToIgnore.push(path);
          });
        }
        break;
      case '--showLineNumber':
        newOptions.showLineNumber = true;
        break;
      default:
        throw new Error(`Not a recognised option '${optionName}'`);
    }
  });

  return newFilesAndOptions;
}

export function extractOptionsFromFiles(files?: string[]): TsFilesAndOptions {
  const filesAndOptions: TsFilesAndOptions = {
    tsFiles: undefined,
    options: {},
  };

  const isOption = (opt: string): boolean => {
    return opt.indexOf('--') === 0;
  };

  if (files) {
    const options = files.filter(f => isOption(f));
    const filteredFiles = files.filter(f => !isOption(f));

    filesAndOptions.tsFiles = filteredFiles.length ? filteredFiles : undefined;

    return processOptions(filesAndOptions, options);
  }

  return filesAndOptions;
}

function canExtractOptionsFromFiles(files?: string[]): boolean {
  try {
    extractOptionsFromFiles(files);
    return true;
  } catch (_e) {
    return false;
  }
}

function isTsConfigValid(tsconfigFilePath: string): boolean {
  return existsSync(tsconfigFilePath) && statSync(tsconfigFilePath).isFile();
}

export function hasValidArgs(): boolean {
  const [tsconfig, ...tsFiles] = process.argv.slice(2);

  if (!tsconfig) {
    return false;
  }

  if (!isTsConfigValid(tsconfig)) {
    console.error(`The tsconfig file '${tsconfig}' could not be found.`);
    return false;
  }

  if (!canExtractOptionsFromFiles(tsFiles)) {
    console.error(`Invalid options.`);
    return false;
  }

  return true;
}
