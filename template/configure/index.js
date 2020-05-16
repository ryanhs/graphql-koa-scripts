const { RedisPubSub } = require('graphql-redis-subscriptions');
const { withFilter } = require('graphql-subscriptions');

module.exports = ({ graphqlHandler }) => {
  return ({

    // in this stage, its usefull to modify existing dependencies.
    configure(deps) {

      // example to change PubSub into RedisPubSub,
      const graphqlPubSub = new RedisPubSub({
        connection: {
          host: 'localhost',
          port: 6379,
        }
      });

      // since graphqlPubSub is global, we make it global too
      global.graphqlPubSub = graphqlPubSub;


      // and now we add foo along, in our dependencies.
      return { foo: 'bar', graphqlPubSub };
    },

    // use koa-router
    router(r, deps) {

      // foo called here
      sdk.log.warn('deps.foo', deps.foo)

      // lets examine graphqlPubSub on deps scope
      sdk.log.info(`deps.graphqlPubSub => ${deps.graphqlPubSub.constructor.name}`)

      // lets examine graphqlPubSub on global scope
      sdk.log.info(`global.graphqlPubSub => ${graphqlPubSub.constructor.name}`)


      // test qs
      r.get('/qs', (ctx) => { ctx.body = ctx.query; });

      // its ok to add handlers here
      graphqlHandler({
        typeDefs: `
          type Query {
            hello: String
          }
          type Subscription {
            healthcheck: String
          }
        `,
        resolvers: {
          Query: {
            hello: () => 'Awesome!'
          },
          Subscription: {
            healthcheck: {
              subscribe: withFilter(
                () => global.graphqlPubSub.asyncIterator('all'),
                (payload /* , variables */) => typeof payload.healthcheck === 'string',
              ),
            },
          },
        },
        endpointUrl: '/graphql',
      });

    },

    hooks: [
      { on: 'http:listen:after', priority: -1, fn: () => {
        sdk.log.info('you can type `redis-cli monitor` to check the Subscription!')
      }},
    ]

  });
};
