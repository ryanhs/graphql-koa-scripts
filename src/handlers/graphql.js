const { ApolloServer } = require('apollo-server-koa');
const { graphql } = require('graphql');

const formatError = require('./graphqlFormatError');

module.exports = ({ koaRouter, hook, logger }) => (options) => {
  const { resolvers, typeDefs, endpointUrl = '/graphql' } = options;

  // setup server
  const server = new ApolloServer({
    endpointUrl,
    formatError,
    introspection: process.env.NODE_ENV === 'development',
    playground:
      process.env.NODE_ENV === 'production'
        ? false
        : {
            settings: {
              'editor.theme': 'light',
              'request.credentials': 'same-origin',
            },
          },
    ...options,
  });
  server.graphql = graphql;

  // setup koa router /graphql/schema for dev environment, easier to read
  if (process.env.NODE_ENV === 'development') {
    koaRouter.all(`${endpointUrl}/schema`, (ctx) => {
      ctx.type = 'text/plain';
      ctx.body = typeDefs;
    });
  }

  // setup graphql api based on endpointUrl
  koaRouter.all(
    endpointUrl,
    server.getMiddleware({
      path: endpointUrl,
    }),
  );

  // notify
  logger.info('🚀 Graphql attached!', {
    service: 'graphql',
    endpointUrl,
  });
  hook.emit('http:graphqlHandler:added', {
    server,
    options,
  });

  // setup ws /graphql if we have it
  if (resolvers.Subscription) {
    hook.on('http:listen:after', ({ httpServer }) => {
      server.installSubscriptionHandlers(httpServer);
      logger.info('🚀 WS ready!', {
        service: 'graphql-ws',
        endpointUrl,
      });
    });
  }

  // return apollo server
  return server;
};
