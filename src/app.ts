import { readFileSync } from 'fs';
import { dirname } from 'path';
import parseFiles from './parser';
import analyze from './analyzer';

export default (tsconfigPath:string) =>
  analyze(
    parseFiles(
      dirname(tsconfigPath),
      JSON.parse(readFileSync(tsconfigPath, { encoding: 'utf8' })).files
    )
  );
