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

  it('test mutation', async () => {
    GraphqlHandler(d)({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
        Mutation: {
          helloMutate: () => 'Awesome!',
        },
      },
      typeDefs: `
      type Query {
        hello: String!
      }
      type Mutation {
        helloMutate: String!
      }
    `,
      endpointUrl: '/graphql/dadadada',
    });

    let graphqlClient;
    d.hook.on('http:graphqlHandler:added', (tmp) => (graphqlClient = tmp.apolloClient));
    await d.hook.emit('makeApp:after', d);

    // test
    const req = graphqlClient.mutate({ mutation: 'mutation { helloMutate }' });
    await expect(req).resolves.toMatchObject({
      data: {
        helloMutate: 'Awesome!',
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
});
