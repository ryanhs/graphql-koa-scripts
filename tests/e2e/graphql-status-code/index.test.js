const superagent = require('superagent');
const { Server } = require('../../../src');

const PORT = 13007;

describe('can create a server inline', () => {
  const App = {
    configure: () => ({ PORT }),

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
      });
    },
  };

  it('try graphql', async () => {
    const { quit } = await Server(App);

    const res = superagent.post(`http://localhost:${PORT}/graphql`).type('json').send({
      query: '{ hello() }',
    });
    // .catch((e) => console.log(e.status, e.toString()));

    await expect(res).resolves.toMatchObject({
      body: {
        errors: expect.arrayContaining([
          expect.objectContaining({
            httpStatusCode: 400,
          }),
        ]),
      },
    });

    return quit();
  });
});
