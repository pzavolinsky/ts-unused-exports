import analyzeTsConfig from './app';
import { existsSync, statSync } from 'fs';

const tsconfig = process.argv.slice(2)[0];

if (!tsconfig || !existsSync(tsconfig) || !statSync(tsconfig).isFile()) {
  console.error(`usage: ts-unused-exports path/to/tsconfig.json`);
  process.exit(-1);
}

const analysis = analyzeTsConfig(tsconfig);

const files = Object.keys(analysis);

console.log(`${files.length} module${
  files.length == 1 ? '' : 's'
} with unused exports`);

files.forEach(path => console.log(`${path}: ${analysis[path].join(', ')}`));

process.exit(files.length);
