import { readFileSync } from 'fs';
import { dirname } from 'path';
import parseFiles from './parser';
import analyze from './analyzer';

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string
  }
  files?: string[]
}

const loadTsConfig = (
  tsconfigPath:string,
  explicitFiles:string[]|undefined
) => {
  const rawTsConfig:TsConfig = JSON.parse(
    readFileSync(tsconfigPath, { encoding: 'utf8' })
  );

  const tsConfig = explicitFiles
    ? { ...rawTsConfig, files: explicitFiles }
    : rawTsConfig;

  const { files, compilerOptions } = tsConfig;

  if (!files) throw `
    The tsconfig does not contain a "files" key:

      ${tsconfigPath}

    Consider either passing an explicit list of files or adding the "files" key.
  `;

  const baseUrl = compilerOptions && compilerOptions.baseUrl;

  return { baseUrl, files} ;
};

export default (tsconfigPath:string, files?:string[]) => {
  const tsConfig = loadTsConfig(tsconfigPath, files);
  return analyze(
    parseFiles(
      dirname(tsconfigPath),
      tsConfig.files,
      tsConfig.baseUrl
    )
  );
};
