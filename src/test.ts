import chalk = require('chalk');

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import pickledCucumber, { SetupFn } from 'pickled-cucumber';

import { Analysis } from './types';
import analyzeTsConfig from './app';
import { join } from 'path';
import { runCli } from './cli';
import { tmpdir } from 'os';

// No colors
chalk.level = 0;

const setup: SetupFn = ({
  After,
  Before,
  compare,
  getCtx,
  Given,
  setCtx,
  Then,
  When,
}) => {
  const pathFor = (fileName: string): string =>
    !fileName || fileName.startsWith('--')
      ? fileName
      : join(getCtx('DIR'), fileName);
  const createFile = (path: string, content: string): void => {
    const segments = path.split('/');
    const dirs = segments.slice(0, segments.length - 1);
    const fileName = segments[segments.length - 1];
    const basePath = dirs.reduce((base, name) => {
      const dir = join(base, name);
      if (!existsSync(dir)) mkdirSync(dir);
      return dir;
    }, getCtx('DIR'));
    writeFileSync(join(basePath, fileName), content, { encoding: 'utf8' });
  };

  Before(() => {
    setCtx('DIR', mkdtempSync(join(tmpdir(), 'ts-unused-exports-')));
    createFile('tsconfig.json', '{ "include": ["**/*.ts", "**/*.tsx"] }');
  });
  After(() => {
    if (process.env.KEEP_DATA) return;
    const tmp = getCtx<string>('DIR');
    if (!tmp.startsWith(tmpdir())) {
      throw new Error(`
      I cannot run a tear down on an non-temporary dir.

      Not sure how this happened, but "${tmp}" is not a temporary directory!
      `);
    }
    const removeDir = (path: string): void => {
      const items = readdirSync(path, { encoding: 'utf8' }).filter(
        (f) => f[0] !== '.',
      );
      const files = items.filter((f) => !!f.match(/\.(json|ts|tsx|js|jsx)$/));
      files.forEach((f) => unlinkSync(join(path, f)));
      const dirs = items.filter((i) => !files.includes(i));
      dirs.forEach((d) => removeDir(join(path, d)));
      rmdirSync(path);
    };
    removeDir(tmp);
  });

  Given('file "{filename}" is', createFile, { inline: true });

  // We need this because the `at` operator uses `.` to nest objects.
  const fixDot = (s: string): string => s.replace(/\.ts/g, '_ts');

  When(
    'analyzing "{filename}"',
    (tsconfigFileName, fileNames) => {
      const { unusedFiles, ...result } = analyzeTsConfig(
        pathFor(tsconfigFileName),
        fileNames ? JSON.parse(fileNames).map(pathFor) : undefined,
      );
      const tmp = `${getCtx('DIR')}/`;
      const withoutTmpDir = Object.keys(result).reduce((acc, k) => {
        acc[fixDot(k.replace(tmp, ''))] = result[k];
        return acc;
      }, {} as typeof result);
      setCtx('$result', withoutTmpDir);
      const withoutTmpFiles = unusedFiles?.map((k) => {
        return k.replace(tmp, '');
      });
      setCtx('$unused_files', withoutTmpFiles);
    },
    { optional: 'with files' },
  );
  When('running ts-unused-exports(.*)', (args) => {
    const stdout = [] as string[];
    const stderr = [] as string[];

    try {
      const status = runCli(
        (code) => code,
        (s) => stderr.push(s as string),
        (s) => stdout.push(s),
        args
          .trim()
          .split(' ')
          .map((s) => s.replace(/^"(.*)"$/, '$1'))
          .map(pathFor),
      );
      setCtx('$run', {
        status,
        stdout: stdout.join('\n'),
        stderr: stderr.join('\n'),
      });
    } catch (status) {
      setCtx('$run', {
        status,
        stdout: stdout.join('\n'),
        stderr: stderr.join('\n'),
      });
    }
  });
  Then(
    'the( raw)? result {op}',
    (raw, op, payload) => {
      const result = getCtx<Analysis>('$result');
      // Note: when `raw` is not set, we are only asserting for symbol names
      const actual = raw
        ? result
        : Object.keys(result).reduce((acc, k) => {
            acc[k] = result[k].map((item) => item.exportName);
            return acc;
          }, {} as Record<string, string[]>);
      compare(fixDot(op), actual, fixDot(payload));
    },
    { inline: true },
  );
  Then(
    'the CLI result {op}',
    (op, payload) => compare(op, getCtx('$run'), payload),
    { inline: true },
  );
  Then(
    'the unused file {op}',
    (op, payload) => compare(op, getCtx('$unused_files'), payload),
    { inline: true },
  );
};

pickledCucumber(setup, {
  aliases: {
    filename: /[^"]+/,
  },
  usage: !!process.env.VERBOSE,
});
