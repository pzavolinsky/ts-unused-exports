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
  const analysis = analyzeTsConfig(
    tsconfig,
    tsFiles.length
      ? tsFiles
      : undefined
  );

  const files = Object.keys(analysis);

  console.log(chalk.red(`${chalk.bold(files.length.toString())} module${
    files.length == 1 ? '' : 's'
    } with unused exports`));

  files.forEach(path => console.log(`${path}: ${chalk.bold.yellow(analysis[path].join(", "))}`));

  const options = extractOptionsFromFiles(tsFiles).options;
  if (options && options.exitWithCount) {
    process.exit(files.length);
  }
} catch (e) {
  console.error(e);
  process.exit(-1);
}
