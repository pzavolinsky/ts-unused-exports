const parseFiles = require('../lib/parser').default;
const analyzeFiles = require('../lib/analyzer').default;

const test = (paths) =>
  analyzeFiles(parseFiles('./spec/data', ['./exports.ts'].concat(paths)));
const test1 = (paths, expected) => expect(
    test(paths)['exports']
  ).toEqual(
    expected
  );
const itIs = (what, paths, expected) =>
  it(`handles import ${what}`, () => { test1(paths, expected); });

describe('analyze', () => {
  itIs('nothing', []                       , [ 'a', 'b', 'c', 'd', 'default' ]);
  itIs('default', ['./import-default.ts']  , [ 'a', 'b', 'c', 'd' ]);
  itIs('a'      , ['./import-a.ts']        , [ 'b', 'c', 'd', 'default' ]);
  itIs('b'      , ['./import-b.ts']        , [ 'a', 'c', 'd', 'default' ]);
  itIs('c'      , ['./import-c.ts']        , [ 'a', 'b', 'd', 'default' ]);
  itIs('d'      , ['./import-d.ts']        , [ 'a', 'b', 'c', 'default' ]);
  itIs('*'      , ['./import-star.ts']     , [ 'default' ]);
  itIs('all'    , ['./import-star.ts'
                  ,'./import-default.ts'], undefined);
  it('handles export * from', () => {
    const result = test(['./import-export-star.ts']);

    expect(result['exports']).toEqual(['default']);
    expect(result['import-export-star']).toEqual([ 'a', 'b', 'c', 'd' ]);
  });
});
