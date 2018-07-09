const { join } = require('path');
const parseFiles = require('../lib/parser').default;
const analyzeFiles = require('../lib/analyzer').default;

const testWith = (paths, baseUrl) =>
  analyzeFiles(parseFiles('./spec/data', paths, baseUrl));
const testExports = (paths) => testWith(['./exports.ts'].concat(paths));
const test1 = (paths, expected) => expect(
    testExports(paths)['exports']
  ).toEqual(
    expected
  );

describe('analyze', () => {
  const itIs = (what, paths, expected) =>
    it(`handles import ${what}`, () => { test1(paths, expected); });

  itIs('nothing', []                       , [ 'a', 'b', 'c', 'd', 'e', 'default' ]);
  itIs('default', ['./import-default.ts']  , [ 'a', 'b', 'c', 'd', 'e' ]);
  itIs('a'      , ['./import-a.ts']        , [ 'b', 'c', 'd', 'e', 'default' ]);
  itIs('b'      , ['./import-b.ts']        , [ 'a', 'c', 'd', 'e', 'default' ]);
  itIs('c'      , ['./import-c.ts']        , [ 'a', 'b', 'd', 'e', 'default' ]);
  itIs('d'      , ['./import-d.ts']        , [ 'a', 'b', 'c', 'e', 'default' ]);
  itIs('e'      , ['./import-e.ts']        , [ 'a', 'b', 'c', 'd', 'default' ]);
  itIs('*'      , ['./import-star.ts']     , [ 'default' ]);
  itIs('all'    , ['./import-star.ts'
                  ,'./import-default.ts'], undefined);
  itIs('non-ts' , ['./import-other.ts']    , [ 'b', 'c', 'd', 'e', 'default' ]);

  it('handles export * from', () => {
    const result = testExports(['./import-export-star.ts']);

    expect(result['exports']).toEqual(['default']);
    expect(result['import-export-star']).toEqual([ 'a', 'b', 'c', 'd', 'e' ]);
  });

  it('handles import from directory index', () => {
    const result = testWith(['./index-dir/index.ts']);
    expect(result).toEqual({});
  });

  describe('indexed modules', () => {
    const testIndex = (paths, expected) => expect(
        testWith(['./has-index/index.ts'].concat(paths))['has-index']
      ).toEqual(
        expected
      );

    it('handles missing index imports', () =>
      testIndex([], ['default']));

    it('handles implicit index imports', () =>
      testIndex(['./import-index-implicit.ts'], undefined));

    it('handles explicit index imports', () =>
      testIndex(['./import-index-explicit.ts'], undefined));

    it('handles explicit index imports in the same directory', () =>
      testIndex(['./has-index/import-same-index.ts'], undefined));
  });

  describe('exported default function', () => {
    const testDefault = (paths, expected) => expect(
        testWith(
          ['./export-default-function.ts'].concat(paths)
        )['export-default-function']
      ).toEqual(
        expected
      );

    it('handles missing import', () =>
      testDefault([], ['default']));

    it('handles import', () =>
      testDefault(['./import-default-function.ts'], undefined));
  });

  describe('exported default named function', () => {
    const testDefault = (paths, expected) => expect(
        testWith(
          ['./export-default-named-function.ts'].concat(paths)
        )['export-default-named-function']
      ).toEqual(
        expected
      );

    it('handles missing import', () =>
      testDefault([], ['default']));

    it('handles import', () =>
      testDefault(['./import-default-named-function.ts'], undefined));
  });

  describe('baseUrl', () => {
    const testBaseUrl = (paths, expected, ext) => () => expect(
        testWith(
          [`./mod-dir-${ext}/exports.${ext}`].concat(paths),
          `./mod-dir-${ext}`
        )[join(`mod-dir-${ext}`, 'exports')]
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
