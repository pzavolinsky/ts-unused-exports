import chalk = require('chalk');

import analyzeTsConfig from './app';
import { extractOptionsFromFiles, hasValidArgs } from './argsParser';
import { LocationInFile, Analysis, ExtraCommandLineOptions } from './types';
import { USAGE } from './usage';

// eslint style exit code:
enum ExitCode {
  NoUnusedExportsFound = 0,
  UnusedExportsFound = 1,
  BadArgsOrException = 2,
}

const getLocationInFile = (location: LocationInFile): string => {
  if (!location) {
    return '';
  }
  return `[${location.line},${location.character}]`;
};

const showMessages = (
  files: string[],
  showMessage: (s: string) => void,
  analysis: Analysis,
  options: ExtraCommandLineOptions | undefined,
): void => {
  const filesCountMessage = `${chalk.bold(files.length.toString())} module${
    files.length == 1 ? '' : 's'
  } with unused exports`;

  showMessage(files.length ? chalk.red(filesCountMessage) : filesCountMessage);

  if (options?.showLineNumber) {
    files.forEach(path => {
      analysis[path].forEach(unusedExport => {
        showMessage(
          `${path}${getLocationInFile(
            unusedExport.location,
          )}: ${chalk.bold.yellow(unusedExport.exportName)}`,
        );
      });
    });
  } else {
    files.forEach(path =>
      showMessage(
        `${path}: ${chalk.bold.yellow(
          analysis[path].map(r => r.exportName).join(', '),
        )}`,
      ),
    );
  }
};

export const runCli = (
  exitWith: (code: ExitCode) => ExitCode,
  showError: (s: string) => void,
  showMessage: (s: string) => void,
  [tsconfig, ...tsFiles]: string[],
): ExitCode => {
  if (!hasValidArgs(showError, tsconfig, tsFiles)) {
    showError(USAGE);
    return exitWith(ExitCode.BadArgsOrException);
  }

  try {
    const analysis = analyzeTsConfig(
      tsconfig,
      tsFiles.length ? tsFiles : undefined,
    );

    const files = Object.keys(analysis);

    const options = extractOptionsFromFiles(tsFiles).options;

    const hideMessages = options?.silent && files.length === 0;
    if (!hideMessages) {
      showMessages(files, showMessage, analysis, options);
    }

    if (options?.exitWithCount) {
      // Max allowed exit code is 127 (single signed byte)
      return exitWith(Math.min(127, files.length));
    }

    const maxIssues = options?.maxIssues || 0;

    return exitWith(
      files.length <= maxIssues
        ? ExitCode.NoUnusedExportsFound
        : ExitCode.UnusedExportsFound,
    );
  } catch (e) {
    showError(e);
    return exitWith(ExitCode.BadArgsOrException);
  }
};
