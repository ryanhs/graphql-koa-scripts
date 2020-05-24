# Graphql Koa Scripts - Examples

## Simple Without cli

yes, you can use the project without cli,
but be sure to use something like `pm2`, `nodemon`, or other process manager
to restart your app.

```javascript
const { Server } = require('graphql-koa-scripts');

Server(({ graphqlHandler }) => ({

  configure: () => ({ PORT: 8080 }),

  router(r) {
    graphqlHandler({
      typeDefs: `
          type Query {
            hello: String
          }
        `,
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      endpointUrl: '/graphql',
    });
  },

}))

```

> `Server(App)`, App can be string to absolute-path filename, or object or Function.


## Testing

Ah yes, testing. Its not forgotten :-) dont worry, we cover it.

The `App` is the same, just diffent `Server`. `TestServer`. Example using `jest`:

```javascript
const { TestServer } = require('graphql-koa-scripts');

describe('test server ok', () => {

  it('try graphql', async () => {
    const { apolloClients, quit } = await TestServer(`${__dirname}/path-to-your-app.js`);

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

});

```

> `TestServer(App)`, App can be string to absolute-path filename, or object or Function.


### UsingTestServer

> A wrapper of bluebird.using, wrap quit() as disposer. easier testing

```javascript
const { UsingTestServer } = require('graphql-koa-scripts');

describe('using TestServer(App).test(fn)', () => {

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
```
