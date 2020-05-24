const { TestServer } = require('../../../src');

describe('check app file existence', () => {
  it('boot up failed', async () =>
    expect(TestServer(`${__dirname}/not-exists.js`)).rejects.toThrow(/doesn't exists/gi));
});
