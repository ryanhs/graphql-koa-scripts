const getFreePort = require('find-free-port');


module.exports = async ({ graphqlHandler }) => {
  const [PORT] = await getFreePort(20000);

  return ({
    configure() {
      return { PORT };
    },

    // use koa-router
    router(r) {
      // its ok to add handlers here
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
  })
};
