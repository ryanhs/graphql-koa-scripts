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
