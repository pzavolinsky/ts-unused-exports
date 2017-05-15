const { join } = require('path');
const app = require('../lib/app').default;

describe('app', () => {
  it('support comments in tsconfig', () => {
    // should not throw
    app(join(__dirname, 'data/tsconfig-with-comments.json'));
  });
});
