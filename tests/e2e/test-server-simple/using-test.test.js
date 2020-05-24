const { UsingTestServer } = require('../../../src');

describe('using TestServer(App).test(fn)', () => {
  it(
    'auto quit',
    UsingTestServer(`${__dirname}/app.js`, async () => {
      expect(1).toBe(1);
    }),
  );

  it(
    'try /qs',
    UsingTestServer(`${__dirname}/app.js`, async ({ supertest }) => {
      const response = supertest.get('/qs?foo=bar');
      await expect(response).resolves.not.toThrow();

      const { body } = await response;
      expect(body).toMatchObject({ foo: 'bar' });
    }),
  );

  it(
    'try /healthcheck',
    UsingTestServer(`${__dirname}/app.js`, async ({ supertest }) => {
      const response = supertest.get('/ping');
      await expect(response).resolves.not.toThrow();

      const { text } = await response;
      expect(new Date(text).toISOString()).toBe(text); // parse iso string and ok
    }),
  );

  it(
    'try graphql',
    UsingTestServer(`${__dirname}/app.js`, async ({ apolloClients }) => {
      const res = apolloClients['/graphql'].query({
        query: '{ hello }',
      });

      await expect(res).resolves.toMatchObject({
        data: {
          hello: 'Awesome!',
        },
      });
    }),
  );
});
