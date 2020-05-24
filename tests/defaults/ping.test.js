const handler = require('../../src/defaults/ping');

describe('just a simple koa route test', () => {
  it('print date', () => {
    const ctx = { body: '' };
    handler(ctx);

    // its string
    expect(ctx.body).toEqual(expect.any(String));
  });
});
