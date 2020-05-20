const { ApolloServer } = require('apollo-server-koa');

module.exports = ({
  koaRouter, hook, sdk,
}) => (options) => {
  const { resolvers, typeDefs, endpointUrl = '/graphql' } = options;

  // setup server
  const server = new ApolloServer({
    endpointUrl,
    formatError: (e) => {
      let code = 'E_UNKNOWN_ERROR';
      const message = e.message || 'Unexpected error occurred!';
      let httpStatusCode = 500;

      const { locations, path } = e;
      let stack = e.stack ? e.stack.split('\n') : [];

      // custom stack from extensions? oke lets go.
      if (e.extensions && e.extensions.exception && e.extensions.exception.stacktrace) {
        stack = stack.concat(e.extensions.exception.stacktrace);
      }

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

      // tailor according env
      return process.env.NODE_ENV === 'development' ? ({
        locations, path, message, code, httpStatusCode, stack,
      }) : ({
        locations, path, message, code, httpStatusCode,
      });
    },
    introspection: process.env.NODE_ENV === 'development',
    playground: process.env.NODE_ENV === 'production' ? false : {
      settings: {
        'editor.theme': 'light',
        'request.credentials': 'same-origin',
      },
    },
    ...options,
  });

  // setup koa router /graphql/schema for dev environment, easier to read
  if (process.env.NODE_ENV === 'development') {
    koaRouter.all(`${endpointUrl}/schema`, (ctx) => { ctx.body = typeDefs; });
  }

  // setup graphql api based on endpointUrl
  koaRouter.all(endpointUrl, server.getMiddleware({
    path: endpointUrl,
  }));

  // notify
  sdk.log.info('🚀 Graphql attached!', { service: 'graphql', endpointUrl });
  hook.emit('http:graphqlHandler:added', { server, options })

  // setup ws /graphql if we have it
  if (resolvers.Subscription) {
    hook.on('http:listen:after', ({ httpServer }) => {
      server.installSubscriptionHandlers(httpServer);
      sdk.log.info('🚀 WS ready!', { service: 'graphql-ws', endpointUrl });
    });
  }

  // return apollo server
  return server
};
