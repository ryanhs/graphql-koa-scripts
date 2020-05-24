// dependencies
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');
const HookEmitter = require('hook-emitter').default;
const bluebird = require('bluebird');

// loaders
const koaLoader = require('./koa');
const loggerLoader = require('./logger');

// require handlers wrapper graphql
const GraphqlHandler = require('../handlers/graphql.js');

// exports everything, add all dependencies, load in order
module.exports = () =>
  bluebird
    .resolve({})

    // basic
    .then(async (dependencies) => ({
      ...dependencies,
      hook: new HookEmitter(),
      bluebird,
    }))

    // Hook must be global
    .tap((dependencies) => {
      global.Hook = dependencies.hook;
    })

    // logger
    .then(async (dependencies) => ({
      ...dependencies,
      logger: loggerLoader({
        isProduction: process.env.NODE_ENV === 'production',
      }),
    }))

    // koa
    .then(async (dependencies) => ({
      ...dependencies,
      ...koaLoader(),
    }))

    // Graphql PubSub
    .then(async (dependencies) => ({
      ...dependencies,
      graphqlPubSub: new GraphqlPubSub(),
    }))

    // Graphql PubSub must be global
    .tap((dependencies) => {
      global.graphqlPubSub = dependencies.graphqlPubSub;
    })

    // Graphql handler
    .then(async (dependencies) => ({
      ...dependencies,
      graphqlHandler: GraphqlHandler(dependencies),
    }));
