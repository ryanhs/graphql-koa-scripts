// dependencies
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');
const { bootstrap: bootstrapSdk } = require('ncurated');
const HookEmitter = require('hook-emitter').default;
const bluebird = require('bluebird');

// require http server #1
const Koa = require('koa');
const Router = require('@koa/router');

// require handlers wrapper graphql
const GraphqlHandler = require('./handlers/graphql.js');

// exports everything
module.exports = async () => {
  const dependencies = {};

  // basic
  dependencies.sdk = await bootstrapSdk(process.env.NODE_ENV);
  dependencies.hook = new HookEmitter();

  // http server #2
  dependencies.koa = new Koa();
  dependencies.koaRouter = new Router();
  dependencies.koa.use(dependencies.koaRouter.routes());

  // handlers
  dependencies.graphqlHandler = GraphqlHandler(dependencies);

  // extra
  dependencies.graphqlPubSub = new GraphqlPubSub();

  // make awesome libs global
  global.Hook = dependencies.hook;
  global.graphqlPubSub = dependencies.graphqlPubSub;
  global.sdk = dependencies.sdk;

  // make awesome libs global
  global.yup = require('yup');
  global.moment = require('moment');
  global.bluebird = bluebird;
  global.faker = require('faker');
  global.flaverr = require('flaverr');

  return dependencies;
};
