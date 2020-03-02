import { existsSync, statSync } from 'fs';

import { ExtraCommandLineOptions } from './types';

type TsFilesAndOptions = {
  tsFiles?: string[];
  options?: ExtraCommandLineOptions;
};

function processOptions(
  filesAndOptions: TsFilesAndOptions,
  options: string[],
): TsFilesAndOptions {
  const pathsToExcludeFromReport: string[] = [];
  const ignoreFilesRegex: string[] = [];
  const maxIssues = 0;
  const newOptions: ExtraCommandLineOptions = {
    pathsToExcludeFromReport,
    ignoreFilesRegex,
    maxIssues,
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
      case '--allowUnusedTypes':
        newOptions.allowUnusedTypes = true;
      case '--excludeDeclarationFiles':
        newOptions.excludeDeclarationFiles = true;
        break;
      case '--excludePathsFromReport':
        {
          const paths = optionValue.split(';');
          paths.forEach(path => {
            pathsToExcludeFromReport.push(path);
          });
        }
        break;
      case '--exitWithCount':
        newOptions.exitWithCount = true;
        break;
      case '--ignoreFiles':
        {
          ignoreFilesRegex.push(optionValue);
        }
        break;
      case '--ignoreProductionFiles':
        {
          ignoreFilesRegex.push(`^(?!.*(test|Test)).*$`);
        }
        break;
      case '--ignoreTestFiles':
        {
          ignoreFilesRegex.push(`(spec|test|Test)`);
        }
        break;
      case '--maxIssues':
        {
          newFilesAndOptions.options = {
            ...newFilesAndOptions.options,
            maxIssues: parseInt(optionValue, 10) || 0,
          };
        }
        break;
      case '--searchNamespaces':
        newOptions.searchNamespaces = true;
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
    options: {
      ignoreFilesRegex: [],
      maxIssues: 0,
    },
  };

  const isOption = (opt: string): boolean => {
    return opt.startsWith('--');
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

export function hasValidArgs(
  showError: (s: string) => void,
  tsconfig: string,
  tsFiles: string[],
): boolean {
  if (!tsconfig) {
    return false;
  }

  if (!isTsConfigValid(tsconfig)) {
    showError(`The tsconfig file '${tsconfig}' could not be found.`);
    return false;
  }

  if (!canExtractOptionsFromFiles(tsFiles)) {
    showError(`Invalid options.`);
    return false;
  }

  return true;
}
