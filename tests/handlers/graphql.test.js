// const flaverr = require('flaverr');
const { createTestClient } = require('apollo-server-testing');
const http = require('http');
const request = require('supertest');

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
      hook, koa, koaRouter, logger,
    };
  });


  it('can create successfully', async () => {
    const handler = GraphqlHandler(d);

    const graphqlClient = createTestClient(await handler({
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
    }));

    // test
    const req = graphqlClient.query({ query: '{ hello }' });
    await expect(req).resolves.toMatchObject({
      data: {
        hello: 'Awesome!',
      },
    });
  });

  it('can create successfully, default endpointUrl', async () => {
    const handler = GraphqlHandler(d);
    const server = await handler({
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
    });

    expect(server.config.endpointUrl).toBe('/graphql');
  });

  it('can create successfully, have /schema for NODE_ENV=development', async () => {
    process.env.NODE_ENV = 'development';

    const typeDefs = `
      type Query {
        hello: String!
      }
    `;

    const handler = GraphqlHandler(d);
    const server = await handler({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      typeDefs,
    });

    await request(http.createServer(d.koa.callback()))
      .get('/graphql/schema')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe(typeDefs);
      });
  });

  it('can create successfully, NOT have /schema for NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';

    const typeDefs = `
      type Query {
        hello: String!
      }
    `;

    const handler = GraphqlHandler(d);
    const server = await handler({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      typeDefs,
    });

    const response = await request(http.createServer(d.koa.callback()))
      .get('/graphql/schema');

    expect(response.statusCode).toBe(404);
  });

  it('can create Subscription', async () => {
    const typeDefs = `
      type Query {
        hello: String!
      }
      type Subscription {
        healthcheck: String
      }
    `;

    const handler = GraphqlHandler(d);
    const server = await handler({
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
        Subscription: {
          healthcheck: {
            subscribe: (payload /* , variables */) => typeof payload.healthcheck === 'string',
          },
        },
      },
      typeDefs,
    });

    // something watching in http:listen:after
    expect(d.hook.events.keys()).toContain('http:listen:after');

    // mock httpServer
    const httpServer = {
      on: jest.fn(),
    };
    d.hook.emit('http:listen:after', { httpServer });
    expect(httpServer.on).toBeCalled();
  });


});
