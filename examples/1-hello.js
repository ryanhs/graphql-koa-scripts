// run: node ./examples/1-hello.js

const superagent = require('superagent');
const getFreePort = require('find-free-port');
const { Server } = require('../src');

(async () => {
  const [PORT] = await getFreePort(20000);

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
            hello: () => `Awesome! from port: ${PORT}`,
          },
        },
        endpointUrl: '/graphql',
      });
    },
  };

  Server(App);

  console.log(`\n\nYou can test it on http://localhost:${PORT}/graphql`)
})();
