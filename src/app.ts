import { readFileSync } from 'fs';
import * as ts from 'typescript';
import { dirname, resolve } from 'path';
import parseFiles from './parser';
import analyze, { Analysis } from './analyzer';
import { TsConfig } from './types';
import extractOptionsFromFiles from './ArgsParser';

const parseTsConfig = (tsconfigPath:string) => {
  const basePath = resolve(dirname(tsconfigPath));

  try {
    const parseJsonResult = ts.parseConfigFileTextToJson(
      tsconfigPath,
      readFileSync(tsconfigPath, { encoding: 'utf8' }),
    );

    if (parseJsonResult.error) throw parseJsonResult.error;

    const result = ts.parseJsonConfigFileContent(
      parseJsonResult.config,
      ts.sys,
      basePath,
    );
    if (result.errors.length) throw result.errors;

    return {
      baseUrl: result.raw
        && result.raw.compilerOptions
        && result.raw.compilerOptions.baseUrl,
      paths: result.raw
        && result.raw.compilerOptions
        && result.raw.compilerOptions.paths,
      files: result.fileNames,
    };
  } catch (e) {
    throw `
    Cannot parse '${tsconfigPath}'.

    ${JSON.stringify(e)}
  `;
  }
};

export const loadTsConfig = (
  tsconfigPath:string,
  explicitFiles?:string[],
):TsConfig => {
  const { baseUrl, files, paths } = parseTsConfig(tsconfigPath);

  return { baseUrl, paths, files: explicitFiles || files };
};

export default (tsconfigPath:string, files?:string[]): Analysis => {
  const args = extractOptionsFromFiles(files);

  const tsConfig = loadTsConfig(tsconfigPath, args.tsFiles);

  return analyze(parseFiles(dirname(tsconfigPath), tsConfig,  args.options));
};
