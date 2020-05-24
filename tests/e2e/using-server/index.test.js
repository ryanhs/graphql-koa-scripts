const superagent = require('superagent');
const { UsingServer } = require('../../../src');

describe('UsingServer', () => {
  const App = {
    configure: () => ({ PORT: 13004 }),

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

  it('try graphql', UsingServer(App, async () => {

    const res = superagent.post('http://localhost:13004/graphql').type('json').send({
      query: '{ hello }',
    });

    await expect(res).resolves.toMatchObject({
      body: {
        data: {
          hello: 'Awesome!',
        },
      },
    });

  }));

});
