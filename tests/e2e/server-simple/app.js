module.exports = ({ graphqlHandler }) => ({

  configure() {
    return { PORT: 13002 };
  },

  // use koa-router
  router(r) {

    // test qs
    r.get('/qs', (ctx) => { ctx.body = ctx.query; });

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

});
