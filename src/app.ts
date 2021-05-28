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

    return {
      baseUrl: result.raw?.compilerOptions?.baseUrl || '.', // TODO - use result.options.baseUrl but that seems to require changes (simplicifications?) elsewhere
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

  return analyze(
    parseFiles(dirname(tsconfigPath), tsConfig, args.options),
    args.options,
  );
};
