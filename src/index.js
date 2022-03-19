/* eslint-disable import/no-dynamic-require */

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

  // hold all apollo server to make testing easier
  const apolloClients = {};
  dependencies.hook.on('http:graphqlHandler:added', ({ apolloClient, options: { endpointUrl } }) => {
    apolloClients[endpointUrl] = apolloClient;
  });

  // serve
  dependencies.DISABLE_LISTEN = true;
  dependencies = await module.exports.serve(dependencies, app);

  // supertest wrap
  const supertest = Supertest(dependencies.koa.callback());

  return {
    ...dependencies,
    apolloClients,
    supertest,
  };
});

// test, a wrapper bluebird.using, wrap quit, for easier testing
module.exports.UsingTestServer = (App, fn) => () =>
  bluebird.using(
    module.exports.TestServer(App).disposer((d) => d.quit()),
    fn,
  );

// create a server, pass a string file, or App (object or function)
module.exports.Server = bluebird.method(async (App) => {
  const app = await loadAppFile(App);

  // load
  let dependencies = await module.exports.loader();

  // serve
  dependencies = await module.exports.serve(dependencies, app);

  return { ...dependencies };
});

// real server need Using too? oke
module.exports.UsingServer = (App, fn) => () =>
  bluebird.using(
    module.exports.Server(App).disposer((d) => d.quit()),
    fn,
  );
