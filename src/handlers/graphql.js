const { ApolloServer } = require('apollo-server-koa');

module.exports = ({
  koaRouter, hook, sdk,
}) => ({
  endpointUrl = '/graphql',
  typeDefs,
  resolvers,
}) => {
  // setup server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    endpointUrl,
    formatError: (e) => {
      let code = 'E_UNKNOWN_ERROR';
      let httpStatusCode = 500;
      const { locations, path } = e;
      const message = e.message || 'Unexpected error occurred!';
      const stack = e.stack ? e.stack.split('\n') : [];

      // schema invalid
      if (message.match(/Expected type/g) !== null || message.endsWith('is required, but it was not provided.')) {
        code = 'E_INVALID_ARGINS';
      }

      // use flaverr({ code: ... }) ? oke lets go.
      if (e.extensions && e.extensions.exception && e.extensions.exception.code) {
        code = e.extensions.exception.code;
      }

      // parse statusCode
      const errorCode400 = ['E_INVALID_ARGINS', 'E_NOT_UNIQUE'];
      if (errorCode400.indexOf(code) !== -1) {
        httpStatusCode = 400;
      }

      return ({
        locations, path, message, code, httpStatusCode, stack,
      });
    },
    introspection: process.env.NODE_ENV === 'development',
    playground: process.env.NODE_ENV === 'production' ? false : {
      settings: {
        'editor.theme': 'light',
        'request.credentials': 'same-origin',
      },
    },

  });

  // setup koa router /graphql
  koaRouter.all(`${endpointUrl}/schema`, (ctx) => { ctx.body = typeDefs; });
  koaRouter.all(endpointUrl, server.getMiddleware({
    path: endpointUrl,
  }));
  hook.on('http:listen:after', () => {
    sdk.log.info('🚀 Graphql ready!', { service: 'graphql', endpointUrl });
  });

  // setup ws /graphql if we have it
  if (resolvers.Subscription) {
    hook.on('http:listen:after', ({ httpServer }) => {
      sdk.log.info('🚀 WS ready!', { service: 'graphql-ws', endpointUrl });
      server.installSubscriptionHandlers(httpServer);
    });
  }

};
