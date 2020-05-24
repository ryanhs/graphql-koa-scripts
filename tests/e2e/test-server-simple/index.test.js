const { TestServer } = require('../../../src');

describe('can create test server ', () => {
  it('boot up ok', async () => {
    const { quit } = await TestServer(`${__dirname}/app.js`);
    expect(1).toBe(1); // just boot up test
    return quit();
  });

  it('try graphql', async () => {
    const { apolloClients, quit } = await TestServer(`${__dirname}/app.js`);

    const res = apolloClients['/graphql'].query({
      query: '{ hello }',
    });

    await expect(res).resolves.toMatchObject({
      data: {
        hello: 'Awesome!',
      },
    });

    return quit();
  });

  it('try qs', async () => {
    const { supertest, quit } = await TestServer(`${__dirname}/app.js`);

    const response = supertest.get('/qs?foo=bar');
    await expect(response).resolves.not.toThrow();

    const { body } = await response;
    expect(body).toMatchObject({ foo: 'bar' });

    return quit();
  });
});
