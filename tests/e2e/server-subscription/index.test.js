const superagent = require('superagent');
const getFreePort = require('find-free-port');
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');
const faker = require('@faker-js/faker');
const bluebird = require('bluebird');
const graphqlWS = require('graphql-ws');
const WebSocket = require('ws');
const { Server } = require('../../../src');

describe('can create a server inline', () => {
  let App;
  let PORT;
  let pubsub;
  const endpointUrl = '/api/graphql';

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
            }
          },
          endpointUrl,
        });
      },
    };

    pubsub = new GraphqlPubSub();
  });


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

  it(`try graphql ${endpointUrl}`, async () => {
    const { quit } = await Server(App);

    const res = superagent.post(`http://localhost:${PORT}${endpointUrl}`).type('json').send({
      query: '{ hello }',
    });

    await expect(res).resolves.toMatchObject({
      body: {
        data: {
          hello: 'Awesome!',
        },
      },
    });

    return quit();
  });


  it.each([[faker.name.findName()], [faker.name.findName()], [faker.name.findName()]])(
    'subscribe with new name: %s',
    async (newName) => {
      const { quit, hook } = await Server(App);

      // create ws client
      const wsClient = graphqlWS.createClient({
        webSocketImpl: WebSocket,
        url: `ws://localhost:${PORT}${endpointUrl}`,
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

      const delayTime = 50;

      // let subscriber connect
      await bluebird.delay(delayTime);

      // push a name
      await pushNewName(newName);
      await bluebird.delay(delayTime);

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
