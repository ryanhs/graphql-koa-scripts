const http = require('http');
const { ApolloServer } = require('apollo-server-koa');
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageLocalDefault,
} = require('apollo-server-core');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const formatError = require('./graphqlFormatError');
const makeSubscriptionHandlers = require('./makeSubscriptionHandlers');

const makelandingPagePlugins = () => {
  // production without landing page
  if (process.env.NODE_ENV === 'production') {
    return ApolloServerPluginLandingPageDisabled();
  }

  return ApolloServerPluginLandingPageLocalDefault({
    embed: true,
    // settings: {
    //   'editor.theme': 'light',
    //   'request.credentials': 'same-origin',
    // },
  });
};

module.exports =
  ({ koaRouter, hook, logger }) =>
  (options) => {
    // destructure options
    const { resolvers, typeDefs, endpointUrl = '/graphql', middlewares = [], ...optionsRest } = options;
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // setup koa router /graphql/schema for dev environment, easier to read
    if (process.env.NODE_ENV === 'development') {
      koaRouter.all(`${endpointUrl}/schema`, (ctx) => {
        ctx.type = 'text/plain';
        ctx.body = typeDefs;
      });
    }

    // make Server wrapped, based on httpServer from hooks
    const registerHandler = async (httpServer) => {
      // if we have subscriptions
      let subscriptionPlugins = [];
      if (resolvers.Subscription) {
        const subscriptionHandlers = await makeSubscriptionHandlers({ httpServer, schema, endpointUrl });
        subscriptionPlugins = subscriptionHandlers.plugins;
        logger.trace('🚀 WS ready!', {
          service: 'graphql-ws',
          endpointUrl,
        });
      }

      // create server
      const server = new ApolloServer({
        schema,
        endpointUrl,
        formatError,
        context: ({ctx}) => ctx,
        introspection: process.env.NODE_ENV === 'development',
        debug: process.env.NODE_ENV === 'development',
        logger: logger.child({ service: 'graphql', endpointUrl }),
        ...optionsRest,
        plugins: []
          .concat(
            options.plugins,
            [ApolloServerPluginDrainHttpServer({ httpServer })], // Proper shutdown for the HTTP server.
            subscriptionPlugins,
            [makelandingPagePlugins()],
          )
          .filter((v) => !!v),
      });
      await server.start();

      // add graphql with same version, in case multiple graphql version in the app (vary between modules)
      server.graphql = graphql;

      // setup graphql api based on endpointUrl
      const graphqlServerHandler = server.getMiddleware({
        path: endpointUrl,
        cors: true,
      });
      koaRouter.all(endpointUrl, ...middlewares, async (ctx, next) => {
        await graphqlServerHandler(ctx, next);

        // force 200 for bad request
        if (ctx.status === 400) {
          ctx.status = 200;
        }
      });

      // apollo-server-testing is DEPRECATED, so we simulate graphqlClient
      // > https://www.npmjs.com/package/apollo-server-testing
      const apolloClient = {
        query: (args) => server.executeOperation(args),
        mutate: (args) => {
          // backcompatibility with client.mutate({ mutation: ... })
          const { mutation, ...argsRest } = args;
          return server.executeOperation({ query: mutation, ...argsRest });
        },
      };

      // notify
      logger.info('🚀 Graphql attached!', {
        service: 'graphql',
        endpointUrl,
      });
      await hook.emit('http:graphqlHandler:added', {
        httpServer,
        server, // apolloServer
        apolloClient,
        options,
      });
    };

    // register graphqlHandler after makeApp created OR on serve/listenHttp
    // ApolloServer 3:
    // > we have to `await server.start()` first, before server.applyMiddleware
    // > https://www.apollographql.com/docs/apollo-server/integrations/middleware/#apollo-server-koa
    hook.on('makeApp:after', async (d) => {
      // case A: make new httpServer if listen disabled
      if (d.DISABLE_LISTEN) {
        const httpServer = http.createServer();
        await registerHandler(httpServer);
        return;
      }

      // case B: wait until from serve/listenHttp
      hook.on('http:listen:before', (v) => registerHandler(v.httpServer));
    });
  };
