const superagent = require('superagent');
const { Server } = require('../../../src');

describe('can create a server inline', () => {

  const App = ({
    configure: () => ({ PORT: 14099 }),

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
  });


  it('try graphql', async () => {

    const { quit } = await Server(App);

    const res = superagent
      .post('http://localhost:14099/graphql')
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

});
