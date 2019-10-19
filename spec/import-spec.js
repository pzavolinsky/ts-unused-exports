const parseFiles = require('../lib/parser').default;
const analyzeFiles = require('../lib/analyzer').default;
const { getExportsString } = require('./helper');
const { extractOptionsFromFiles } = require('../lib/argsParser');

const analyzePaths = (files, baseUrl) => {
  const tsFilesAndOptions = extractOptionsFromFiles(files);

  return analyzeFiles(parseFiles('./spec/data', { files: tsFilesAndOptions.tsFiles, baseUrl: baseUrl }, tsFilesAndOptions.options))
};
const testWithResults = (...args) => {
  const result = analyzePaths(...args);

  return getExportsString(result);
};

const testExports = (paths) => testWithResults(['./exports.ts'].concat(paths));
const test1 = (paths, expected) => expect(testExports(paths)).toEqual(expected);

describe('analyze', () => {
  const itIs = (what, paths, expected) =>
    it(`handles import ${what}`, () => { test1(paths, expected); });

  itIs('nothing', [], ['a', 'b', 'c', 'd', 'e', 'default']);
  itIs('default', ['./import-default.ts'], ['a', 'b', 'c', 'd', 'e']);

  // Test ignoring results for some paths:
  itIs('nothing', ['./import-default.ts', '--ignorePaths=exports;other-1'], []);
  itIs('default', ['./import-default.ts', '--ignorePaths=other-1;other-2'], ['a', 'b', 'c', 'd', 'e']);

  itIs('a', ['./import-a.ts'], ['b', 'c', 'd', 'e', 'default']);
  itIs('b', ['./import-b.ts'], ['a', 'c', 'd', 'e', 'default']);
  itIs('c', ['./import-c.ts'], ['a', 'b', 'd', 'e', 'default']);
  itIs('d', ['./import-d.ts'], ['a', 'b', 'c', 'e', 'default']);
  itIs('e', ['./import-e.ts'], ['a', 'b', 'c', 'd', 'default']);
  itIs('*', ['./import-star.ts'], ['default']);
  itIs('all', ['./import-star.ts'
    , './import-default.ts'], []);
  itIs('non-ts', ['./import-other.ts'], ['b', 'c', 'd', 'e', 'default']);

  it('handles export * from', () => {
    const result = analyzePaths(['./exports.ts', './import-export-star.ts']);
    const keys = Object.keys(result);

    expect(result[keys[0]]).toEqual(['default']);
    expect(result[keys[1]]).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('handles import from directory index', () => {
    const result = testWithResults(['./index-dir/index.ts']);
    expect(result).toEqual([]);
  });

  describe('indexed modules', () => {
    const testIndex = (paths, expected) => expect(
      testWithResults(['./has-index/index.ts'].concat(paths))
    ).toEqual(
      expected
    );

    it('handles missing index imports', () =>
      testIndex([], ['default']));

    it('handles implicit index imports', () =>
      testIndex(['./import-index-implicit.ts'], []));

    it('handles explicit index imports', () =>
      testIndex(['./import-index-explicit.ts'], []));

    it('handles explicit index imports in the same directory', () =>
      testIndex(['./has-index/import-same-index.ts'], []));
  });

  describe('exported default function', () => {
    const testDefault = (paths, expected) => expect(
      testWithResults(
        ['./export-default-function.ts'].concat(paths)
      )
    ).toEqual(
      expected
    );

    it('handles missing import', () =>
      testDefault([], ['default']));

    it('handles import', () =>
      testDefault(['./import-default-function.ts'], []));
  });

  describe('exported default named function', () => {
    const testDefault = (paths, expected) =>
      expect(testWithResults(['./export-default-named-function.ts'].concat(paths)))
        .toEqual(expected);

    it('handles missing import', () =>
      testDefault([], ['default']));

    it('handles import', () =>
      testDefault(['./import-default-named-function.ts'], []));
  });

  describe('baseUrl', () => {
    const testBaseUrl = (paths, expected, ext) => () => expect(
      testWithResults(
        [`./mod-dir-${ext}/exports.${ext}`].concat(paths),
        `./mod-dir-${ext}`
      )
    ).toEqual(
      expected
    );

    const itIs = (what, paths, expected) => {
      it(`handles import ${what}`, testBaseUrl(paths, expected, 'ts'));
      it(`handles import ${what}`, testBaseUrl(paths, expected, 'tsx'));
    }

    itIs('value',
      ['./import-a-with-base-url.ts'],
      ['b', 'c', 'd', 'e', 'default']
    );
    itIs('default',
      ['./import-default-with-base-url.ts'],
      ['a', 'b', 'c', 'd', 'e']
    );
  });
});