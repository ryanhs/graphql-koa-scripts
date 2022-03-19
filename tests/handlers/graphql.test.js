// const flaverr = require('flaverr');
const http = require('http');
const getFreePort = require('find-free-port');
const request = require('supertest');
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');
const faker = require('@faker-js/faker');
const bluebird = require('bluebird');
const graphqlWS = require('graphql-ws');

// needed for test
const HookEmitter = require('hook-emitter').default;
const koaLoader = require('../../src/loaders/koa');
const loggerLoader = require('../../src/loaders/logger');

// method to test
const GraphqlHandler = require('../../src/handlers/graphql');

describe('graphqlHandler is ust apollo server maker', () => {
  let d = {};

  beforeEach(async () => {
    const hook = new HookEmitter();
    const { koa, koaRouter } = koaLoader();
    const logger = loggerLoader({ isProduction: false });

    d = {
      hook,
      koa,
      koaRouter,
      logger,
      graphqlPubSub: new GraphqlPubSub(),
      DISABLE_LISTEN: true,
    };
  });

  it('can create successfully', async () => {
    GraphqlHandler(d)({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      typeDefs: `
      type Query {
        hello: String!
      }
    `,
      endpointUrl: '/graphql/dadadada',
    });

    let graphqlClient;
    d.hook.on('http:graphqlHandler:added', (tmp) => (graphqlClient = tmp.apolloClient));
    await d.hook.emit('makeApp:after', d);

    // test
    const req = graphqlClient.query({ query: '{ hello }' });
    await expect(req).resolves.toMatchObject({
      data: {
        hello: 'Awesome!',
      },
    });
  });

  it('can create successfully, default endpointUrl', async () => {
    GraphqlHandler(d)({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      typeDefs: `
      type Query {
        hello: String!
      }
    `,
      endpointUrl: '/graphql/dadadada',
    });

    let server;
    d.hook.on('http:graphqlHandler:added', (tmp) => (server = tmp.server));
    await d.hook.emit('makeApp:after', d);

    expect(server.config.endpointUrl).toBe('/graphql/dadadada');
  });

  it('can create successfully, have /schema for NODE_ENV=development', async () => {
    process.env.NODE_ENV = 'development';

    const typeDefs = `
    type Query {
      hello: String!
    }
    `;

    GraphqlHandler(d)({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      typeDefs,
      endpointUrl: '/graphql',
    });
    await d.hook.emit('makeApp:after', d);

    await request(http.createServer(d.koa.callback()))
      .get('/graphql/schema')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe(typeDefs);
      });
  });

  it('can create successfully, NOT have /schema for NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';

    GraphqlHandler(d)({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      typeDefs: `
      type Query {
        hello: String!
      }
    `,
      endpointUrl: '/graphql',
    });
    await d.hook.emit('makeApp:after', d);

    const response = await request(http.createServer(d.koa.callback())).get('/graphql/schema');

    expect(response.statusCode).toBe(404);
  });

  /*
  // https://www.apollographql.com/docs/apollo-server/data/subscriptions/#the-pubsub-class
  it('can create Subscription', async () => {
    d.DISABLE_LISTEN = false;
    d.PORT = (await getFreePort(20000))[0];
    console.log('free', d.PORT)

    const pushNewName = async () => {
      const newName = faker.name.findName();
      // console.log(newName)
      return d.graphqlPubSub.publish('NEW_NAME', { newName });
    };
    const publisherIval = setInterval(pushNewName, 100);

    GraphqlHandler(d)({
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
      typeDefs: `
      type Query {
        hello: String!
      }
      type Subscription {
        newName: String
      }
    `,
      endpointUrl: '/graphql',
    });

    // run server
    // await new Promise(resolve => d.hook.on('http:listen:before', resolve));

    // create ws client
    const wsClient = graphqlWS.createClient({
      url: `ws://localhost:${d.PORT}/graphql`,
    });





    console.log('ws client!')
    await pushNewName();

    const NEW_NAME_SUBSCRIPTION = `
      subscription OnNewName{
        newName
      }
    `;



    await bluebird.delay(1000);
    clearInterval(publisherIval);
  });
*/
});
