import analyzeTsConfig from './app';
import { existsSync, statSync } from 'fs';

const [tsconfig, ...tsFiles] = process.argv.slice(2);

if (!tsconfig || !existsSync(tsconfig) || !statSync(tsconfig).isFile()) {
  console.error(`
  usage: ts-unused-exports path/to/tsconfig.json [file1.ts file2.ts]

  Note: if no file is specified after tsconfig, the files will be read from the
  tsconfig's "files" key which must be present.

  If the files are specified, their path must be relative to the tsconfig file.
  For example, given:
    /
    |-- config
    |    \-- tsconfig.json
    \-- src
         \-- file.ts

  Then the usage would be:
    ts-unused-exports config/tsconfig.json ../src/file.ts
  `);
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

  console.log(`${files.length} module${
    files.length == 1 ? '' : 's'
  } with unused exports`);

  files.forEach(path => console.log(`${path}: ${analysis[path].join(', ')}`));

  process.exit(Math.min(255, files.length));
} catch (e) {
  console.error(e);
  process.exit(-1);
}
