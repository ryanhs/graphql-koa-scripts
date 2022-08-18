// run: node ./examples/2-subscription.js

const superagent = require('superagent');
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');
const faker = require('@faker-js/faker');
const getFreePort = require('find-free-port');
const { Server } = require('../src');


const pubsub = new GraphqlPubSub();
const PUBSUBTOPIC_NEW_NAME = 'NEW_NAME';

// pusher
const pushNewName = async (_newName) => {
  const newName = _newName || faker.name.findName();
  // console.log(new Date().toISOString(), `Pushed new name: ${newName}`);

  return pubsub.publish(PUBSUBTOPIC_NEW_NAME, { newName1: newName });
};


setInterval(() => {
  pushNewName();
}, 2000);

(async () => {
  const [PORT] = await getFreePort(20000);
  const App = {
    configure: () => ({ PORT }),

    router(_, { graphqlHandler }) {
      graphqlHandler({
        typeDefs: `
          type Query {
            hello: String
          }

          type Subscription {
            newName1: String
          }
        `,
        resolvers: {
          Query: {
            hello: () => `Awesome! from port: ${PORT}`,
          },
          Subscription: {
            newName1: {
              subscribe: () => pubsub.asyncIterator([PUBSUBTOPIC_NEW_NAME]),
            },
          },
        },
        endpointUrl: '/graphql',
      });
    },
  };

  Server(App);

  console.log(`\n\nYou can test it on http://localhost:${PORT}/graphql`);


})();
