/* eslint-disable import/no-dynamic-require */

const { createTestClient } = require('apollo-server-testing');
const bluebird = require('bluebird');
const path = require('path');
const fs = require('fs');
const Supertest = require('supertest');

// our files
module.exports.loader = require('./loaders');
module.exports.serve = require('./serve');

const loadAppFile = async (App) => {
  let app = App;

  // if App passed as string filename/path
  if (typeof App === 'string') {
    const mainFile = path.resolve(App);
    if (!fs.existsSync(mainFile)) {
      throw new Error(`File: (${mainFile}) doesn't exists!`);
    }

    app = require(mainFile);
  }

  return app;
};

// create a test server, pass a string file, or App (object or function)
module.exports.TestServer = bluebird.method(async (App) => {
  const app = await loadAppFile(App);

  // load
  let dependencies = await module.exports.loader();

  // mark test
  dependencies.DISABLE_LISTEN = true;

  // hold all apollo server to make testing easier
  const apolloClients = {};
  dependencies.hook.on('http:graphqlHandler:added', ({ server, options: { endpointUrl } }) => {
    apolloClients[endpointUrl] = createTestClient(server);
  });

  // trap healthcheck timer
  let healthcheckTimer;
  dependencies.hook.on('healthcheck:added', ({ interval }) => {
    healthcheckTimer = interval;
  });

  // serve
  dependencies = await module.exports.serve(dependencies, app);

  // prepare quit function
  const quit = async () => {
    clearInterval(healthcheckTimer);
  };

  const supertest = Supertest(dependencies.koa.callback());

  return {
    ...dependencies, apolloClients, supertest, quit,
  };
});

// create a server, pass a string file, or App (object or function)
module.exports.Server = bluebird.method(async (App) => {
  const app = await loadAppFile(App);

  // load
  let dependencies = await module.exports.loader();

  // trap healthcheck timer
  let healthcheckTimer;
  dependencies.hook.on('healthcheck:added', ({ interval }) => {
    healthcheckTimer = interval;
  });

  // trap httpServer
  let httpServer = { close: () => null };
  dependencies.hook.on('http:listen:after', ({ httpServer: tmpHttpServer }) => {
    httpServer = tmpHttpServer;
  });


  // serve
  dependencies = await module.exports.serve(dependencies, app);

  // prepare quit function
  const quit = async () => {
    clearInterval(healthcheckTimer);
    await (new Promise((resolve) => httpServer.close(resolve)));
  };

  return { ...dependencies, quit };
});
