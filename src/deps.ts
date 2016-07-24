import { readFileSync } from 'fs';
import { existsSync, statSync } from 'fs';
import { dirname } from 'path';
import parseFiles from './parser';
import { File } from './types';

interface FileMap {
  [index:string]:File
}
interface Dups {
  [index:string]:boolean
}

const getFileMap = (files:File[]):FileMap => {
  const map:FileMap = {};
  files.map(f => map[f.path] = f);
  return map;
};

function dumpFile(
  fileMap:FileMap,
  file:File,
  dups:Dups,
  padd:string = ''
):void {
  if (dups[file.path]) {
    console.log(`${padd}${file.path} [dup]`);
    return;
  }

  console.log(`${padd}${file.path}`);
  dups[file.path] = true;
  Object.keys(file.imports).map(i =>
    dumpFile(
      fileMap,
      fileMap[i],
      dups,
      `${padd} `
    )
  );
};
const dumpDeps = (tsconfigPath:string, moduleName:string) => {
  const files = parseFiles(
    dirname(tsconfigPath),
    JSON.parse(readFileSync(tsconfigPath, { encoding: 'utf8' })).files
  );
  const fileMap = getFileMap(files);
  const file = fileMap[moduleName];
  if (!file) {
    console.error(`cannot find '${moduleName}', valid modules are:\n${
      files.map(f => `  - ${f.path}`).join('\n')
    }`);
    process.exit(-1);
  }

  const dups:Dups = {};

  dumpFile(fileMap, file, dups);
  console.log(`${Object.keys(dups).length} nodes in the dependency tree`);
};

const args = process.argv.slice(2);
const [ tsconfig, file ] = args;

if (!tsconfig || !existsSync(tsconfig) || !statSync(tsconfig).isFile()) {
  console.error(`usage: deps path/to/tsconfig.json path/to/module`);
  process.exit(-1);
}

dumpDeps(tsconfig, file);
