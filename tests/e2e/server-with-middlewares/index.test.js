const superagent = require('superagent');
const { Server } = require('../../../src');

describe('can create a server inline', () => {
  const App = {
    configure: () => ({ PORT: 14001 }),

    router(_, { graphqlHandler }) {
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
        middlewares: [
          (ctx, next) => {
            if (ctx.request.headers.authorization === 'Bearer OK') return next();
            return ctx.throw(401);
          },
        ],
      });
    },
  };

  it('try bearer OK', async () => {
    const { quit } = await Server(App);

    const res = superagent
      .post('http://localhost:14001/graphql')
      .set({ Authorization: 'Bearer OK' })
      .type('json')
      .send({
        query: '{ hello }',
      });

    await expect(res).resolves.toMatchObject({
      body: {
        data: {
          hello: 'Awesome!',
        },
      },
    });

    return quit();
  });

  it('try bearer failed', async () => {
    const { quit } = await Server(App);

    const res = superagent
      .post('http://localhost:14001/graphql')
      // .set({ Authorization: 'Bearer OK' })
      .type('json')
      .send({
        query: '{ hello }',
      });

    await expect(res).rejects.toThrow(/Unauthorized/);

    return quit();
  });
});
