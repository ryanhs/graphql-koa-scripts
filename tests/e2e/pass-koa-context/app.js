const getFreePort = require('find-free-port');

module.exports = async ({ graphqlHandler }) => {
  const [PORT] = await getFreePort(20000);

  // get username from middleware
  const hello = (_, $, { ctx }) => {
    // console.log('hello ctx', ctx.request.me.userId)
    return `hello ${ctx.request.me.userId}!`;
  }

  return {
    configure() {
      return { PORT };
    },

    // use koa-router
    router(r) {

      r.use('/graphql', (ctx, next) => {
        ctx.request.me = { userId: 'dadang1' };
        return next();
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
            hello,
          },
        },
        endpointUrl: '/graphql',
        context: (koaContext) => koaContext,
      });
    },
  };
};
