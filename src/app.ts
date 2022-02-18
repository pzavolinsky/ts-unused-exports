import * as ts from 'typescript';

import analyze, { Analysis } from './analyzer';
import { dirname, resolve } from 'path';

import { TsConfig } from './types';
import { extractOptionsFromFiles } from './argsParser';
import parseFiles from './parser';

const parseTsConfig = (tsconfigPath: string): TsConfig => {
  const basePath = resolve(dirname(tsconfigPath));

  try {
    const configFileName = ts.findConfigFile(
      basePath,
      ts.sys.fileExists,
      tsconfigPath,
    );
    if (!configFileName) throw `Couldn't find ${tsconfigPath}`;

    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);

    const result = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      basePath,
      undefined,
      tsconfigPath,
    );
    if (result.errors.length) throw result.errors;

    // We now use absolute paths to avoid ambiguity and to be able to delegate baseUrl resolving to TypeScript.
    // A consequence is, we cannot fall back to '.' so instead the fallback is the tsconfig dir:
    // (I think this only occurs with unit tests!)
    return {
      baseUrl: result.options.baseUrl || basePath,
      paths: result.options.paths,
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

  return analyze(parseFiles(tsConfig, args.options), args.options);
};
