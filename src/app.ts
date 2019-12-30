import * as ts from 'typescript';

import analyze, { Analysis } from './analyzer';
import { dirname, resolve } from 'path';

import { TsConfig } from './types';
import { extractOptionsFromFiles } from './argsParser';
import parseFiles from './parser';
import { readFileSync } from 'fs';

const parseTsConfig = (tsconfigPath: string): TsConfig => {
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
      baseUrl: result.raw?.compilerOptions?.baseUrl || '.',
      paths: result.raw?.compilerOptions?.paths,
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
  tsconfigPath: string,
  explicitFiles?: string[],
): TsConfig => {
  const { baseUrl, files, paths } = parseTsConfig(tsconfigPath);

  return { baseUrl, paths, files: explicitFiles || files };
};

export default (tsconfigPath: string, files?: string[]): Analysis => {
  const args = extractOptionsFromFiles(files);
  const tsConfig = loadTsConfig(tsconfigPath, args.tsFiles);

  return analyze(
    parseFiles(dirname(tsconfigPath), tsConfig, args.options),
    args.options,
  );
};
