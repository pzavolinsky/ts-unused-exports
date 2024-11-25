import chalk = require('chalk');

import { Analysis, ExtraCommandLineOptions, LocationInFile } from './types';
import { extractOptionsFromFiles, hasValidArgs } from './argsParser';

import { USAGE } from './usage';
import { analyzeTsConfig } from './app';

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
  unusedFiles: string[] | undefined,
  options: ExtraCommandLineOptions | undefined,
): void => {
  const filesCountMessage = `${chalk.bold(files.length.toString())} module${
    files.length == 1 ? '' : 's'
  } with unused exports`;

  showMessage(files.length ? chalk.red(filesCountMessage) : filesCountMessage);

  if (options?.showLineNumber) {
    files.forEach((path) => {
      analysis.unusedExports[path].forEach((unusedExport) => {
        showMessage(
          `${path}${getLocationInFile(
            unusedExport.location,
          )}: ${chalk.bold.yellow(unusedExport.exportName)}`,
        );
      });
    });
  } else {
    files.forEach((path) =>
      showMessage(
        `${path}: ${chalk.bold.yellow(
          analysis.unusedExports[path].map((r) => r.exportName).join(', '),
        )}`,
      ),
    );
  }

  if (unusedFiles && unusedFiles.length > 0) {
    showMessage(chalk.red('Completely unused files:'));

    unusedFiles.forEach((path) => {
      showMessage(path);
    });
  }
};

export const runCli = (
  exitWith: (code: ExitCode) => ExitCode,
  showError: (s: unknown) => void,
  showMessage: (s: string) => void,
  [tsconfig, ...tsFiles]: string[],
): ExitCode => {
  if (!hasValidArgs(showError, tsconfig, tsFiles)) {
    showError(USAGE);
    return exitWith(ExitCode.BadArgsOrException);
  }

  try {
    const { unusedFiles, ...analysis } = analyzeTsConfig(
      tsconfig,
      tsFiles.length ? tsFiles : undefined,
    );

    const files = Object.keys(analysis.unusedExports);

    const options = extractOptionsFromFiles(tsFiles).options;

    const hideMessages = options?.silent && files.length === 0;
    if (!hideMessages) {
      showMessages(files, showMessage, analysis, unusedFiles, options);
    }

    // Max allowed exit code is 127 (single signed byte)
    const MAX_ALLOWED_EXIT_CODE = 127;

    if (options?.exitWithCount) {
      return exitWith(Math.min(MAX_ALLOWED_EXIT_CODE, files.length));
    } else if (options?.exitWithUnusedTypesCount) {
      const totalIssues = files
        .map((f) => analysis.unusedExports[f].length)
        .reduce((previous, current) => previous + current, 0);

      return exitWith(Math.min(MAX_ALLOWED_EXIT_CODE, totalIssues));
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
