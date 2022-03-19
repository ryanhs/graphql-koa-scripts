const superagent = require('superagent');
const getFreePort = require('find-free-port');
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');
const faker = require('@faker-js/faker');
const bluebird = require('bluebird');
const graphqlWS = require('graphql-ws');
const WebSocket = require('ws');
const { Server } = require('../../src');

/* refs:
 * - https://www.apollographql.com/docs/apollo-server/data/subscriptions/#the-pubsub-class
 */

describe('can create a server inline', () => {
  let App;
  let PORT;
  let pubsub;

  const NEW_NAME_SUBSCRIPTION = `
    subscription OnNewName{
      newName
    }
  `;

  // pusher
  const pushNewName = async (_newName) => {
    const newName = _newName || faker.name.findName();
    return pubsub.publish('NEW_NAME', { newName });
  };

  beforeEach(async () => {
    [PORT] = await getFreePort(20000);

    App = {
      configure: () => ({ PORT }),

      router(_, { graphqlHandler }) {
        graphqlHandler({
          typeDefs: `
            type Query {
              hello: String
            }
            type Subscription {
              newName: String
            }
          `,
          resolvers: {
            Query: {
              hello: () => 'Awesome!',
            },
            Subscription: {
              newName: {
                subscribe: () => pubsub.asyncIterator(['NEW_NAME']),
              },
            },
          },
          endpointUrl: '/graphql',
        });
      },
    };

    pubsub = new GraphqlPubSub();
  });

  it.each([[2], [3], [4]])('try subscription %d times', async (xTimes) => {
    const { quit, hook } = await Server(App);
    // create ws client
    const wsClient = graphqlWS.createClient({
      webSocketImpl: WebSocket,
      url: `ws://localhost:${PORT}/graphql`,
    });

    // setup utils
    const gotNewName = jest.fn();
    let unsubscribe = () => null;
    let promise;

    // client subscription, let loose
    promise = new Promise((resolve, reject) => {
      unsubscribe = wsClient.subscribe(
        { query: NEW_NAME_SUBSCRIPTION },
        {
          next: gotNewName,
          error: reject,
          complete: resolve,
        },
      );
    });

    // let subscriber connect
    await bluebird.delay(14);

    // test x times
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < xTimes; i += 1) {
      await pushNewName();
    }
    await bluebird.delay(14);
    /* eslint-enable no-await-in-loop */

    await unsubscribe();

    expect(gotNewName).toBeCalledTimes(xTimes);

    return quit();
  });

  it.each([[faker.name.findName()], [faker.name.findName()], [faker.name.findName()]])(
    'subscribe with new name: %s',
    async (newName) => {
      const { quit, hook } = await Server(App);

      // create ws client
      const wsClient = graphqlWS.createClient({
        webSocketImpl: WebSocket,
        url: `ws://localhost:${PORT}/graphql`,
      });

      // setup utils
      const gotNewName = jest.fn();
      let unsubscribe = () => null;

      // client subscription, let loose
      new Promise((resolve, reject) => {
        unsubscribe = wsClient.subscribe(
          { query: NEW_NAME_SUBSCRIPTION },
          {
            next: gotNewName,
            error: reject,
            complete: resolve,
          },
        );
      });

      // let subscriber connect
      await bluebird.delay(14);

      // push a name
      await pushNewName(newName);
      await bluebird.delay(14);

      // unsubscribe
      await unsubscribe();

      // expect test
      expect(gotNewName).toHaveBeenCalled();

      // The first arg of the first call to the function
      const subscriptionData = gotNewName.mock.calls[0][0];
      expect(subscriptionData).toMatchObject({
        data: {
          newName,
        },
      });

      return quit();
    },
  );
});
