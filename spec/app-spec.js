const { join } = require('path');
const app = require('../lib/app').default;

describe('app', () => {
  it('supports comments in tsconfig', () => {
    // should not throw
    app(join(__dirname, 'data/tsconfig-with-comments.json'));
  });

  it('understands tsconfig include', () => {
    const analysis = app(join(__dirname, 'data/tsconfig-include.json'));
    expect(analysis.exports).toEqual([ 'a', 'b', 'c', 'd', 'e', 'default' ]);
  });

});
