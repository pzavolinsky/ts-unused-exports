import { LocationInFile } from './types';
import { extractOptionsFromFiles, hasValidArgs } from './argsParser';

import analyzeTsConfig from './app';
import chalk from 'chalk';
import { showUsage } from './usage';

const [tsconfig, ...tsFiles] = process.argv.slice(2);

if (!hasValidArgs()) {
  showUsage();
  process.exit(-1);
}

try {
  const analysis = analyzeTsConfig(tsconfig, tsFiles.length ? tsFiles : undefined);

  const files = Object.keys(analysis);

  console.log(
    chalk.red(`${chalk.bold(files.length.toString())} module${files.length == 1 ? '' : 's'} with unused exports`),
  );

  const getLocationInFile = (location: LocationInFile): string => {
    if (!location) {
      return '';
    }
    return `[${location.line},${location.character}]`;
  };

  const options = extractOptionsFromFiles(tsFiles).options;
  if (options && options.showLineNumber) {
    files.forEach(path => {
      analysis[path].forEach(unusedExport => {
        console.log(
          `${path}${getLocationInFile(unusedExport.location)}: ${chalk.bold.yellow(unusedExport.exportName)}`,
        );
      });
    });
  } else {
    files.forEach(path =>
      console.log(`${path}: ${chalk.bold.yellow(analysis[path].map(r => r.exportName).join(', '))}`),
    );
  }

  if (options && options.exitWithCount) {
    process.exit(files.length);
  }
} catch (e) {
  console.error(e);
  process.exit(-1);
}
