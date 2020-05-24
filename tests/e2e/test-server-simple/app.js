module.exports = ({ graphqlHandler }) => ({
  // use koa-router
  router(r) {
    // test qs
    r.get('/qs', (ctx) => {
      ctx.body = ctx.query;
    });

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

  hooks: [
    // { on: 'http:listen:before', fn: () => sdk.log.info('http:listen:before!!!'), },
    // { on: 'http:listen:after', fn: () => sdk.log.info('http:listen:after!!!'), },
  ],
});
