import { readFileSync } from 'fs';
import { dirname } from 'path';
import parseFiles from './parser';
import analyze from './analyzer';

const loadTsConfig = (tsconfigPath:string):string[] => {
  const files:(string[]|undefined) = JSON.parse(
    readFileSync(tsconfigPath, { encoding: 'utf8' })
  ).files;
  if (!files) throw `
    The tsconfig does not contain a "files" key:

      ${tsconfigPath}

    Consider either passing an explicit list of files or adding the "files" key.
  `;

  return files;
};

export default (tsconfigPath:string, files?:string[]) =>
  analyze(
    parseFiles(
      dirname(tsconfigPath),
      files || loadTsConfig(tsconfigPath)
    )
  );
