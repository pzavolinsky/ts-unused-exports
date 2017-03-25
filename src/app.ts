import { readFileSync, lstatSync } from 'fs';
import { dirname } from 'path';
import parseFiles from './parser';
import analyze from './analyzer';
import globFs = require('glob-fs');

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string
  }
  files?: string[],
  include?: string[]
}

const loadTsConfig = (tsconfigPath:string) => {
  const tsConfig:TsConfig = JSON.parse(
    readFileSync(tsconfigPath, { encoding: 'utf8' })
  );

  let { files, compilerOptions, include } = tsConfig;

  if (!files && !include) throw `
    The tsconfig does not contain a "files" key:

      ${tsconfigPath}

    Consider either passing an explicit list of files or adding the "files" key.
  `;

  if (!files && include) {
    files = include
      .filter(isGlob)
      .map((glob) => globFs({}).readdirSync(glob))
      .reduce(concatArrays, [])
      .concat(include.filter(isNotGlob))
      .filter(removeDuplicates)
      .filter(isFile);
  }

  const baseUrl = compilerOptions && compilerOptions.baseUrl;

  return { baseUrl, files} ;
};

export default (tsconfigPath:string, files?:string[]) => {
  const tsConfig = loadTsConfig(tsconfigPath);
  return analyze(
    parseFiles(
      dirname(tsconfigPath),
      files || tsConfig.files || [],
      tsConfig.baseUrl
    )
  );
};

function isGlob(s:string) {
  return s.indexOf('*') !== -1;
}

function concatArrays(result:any[], array:any[]) {
  return result.concat(array);
}

function isNotGlob(s:string) {
  return s.indexOf('*') === -1;
}

function removeDuplicates(item:any, index:number, array:any[]) {
  return array.indexOf(item) === index;
}

function isFile(path:string) {
  return lstatSync(path).isFile();
}
