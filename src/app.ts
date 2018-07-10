import { readFileSync } from 'fs';
import * as ts from 'typescript';
import { dirname, resolve } from 'path';
import parseFiles from './parser';
import analyze, { Analysis } from './analyzer';

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
      files: result.fileNames,
    };
  } catch (e) {
    throw `
    Cannot parse '${tsconfigPath}'.

    ${JSON.stringify(e)}
  `;
  }
};

const loadTsConfig = (
  tsconfigPath:string,
  explicitFiles:string[]|undefined
) => {
  const { baseUrl, files } = parseTsConfig(tsconfigPath);

  return { baseUrl, files: explicitFiles || files };
};

export default (tsconfigPath:string, files?:string[]): Analysis => {
  const tsConfig = loadTsConfig(tsconfigPath, files);
  return analyze(
    parseFiles(
      dirname(tsconfigPath),
      tsConfig.files,
      tsConfig.baseUrl
    )
  );
};
