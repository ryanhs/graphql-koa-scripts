/* eslint-disable import/no-dynamic-require */

const { createTestClient } = require('apollo-server-testing');
const bluebird = require('bluebird');
const path = require('path');
const fs = require('fs');

// .env.test load
require('dotenv')
  .config({
    path: path.resolve(process.cwd(), '.env.test'),
  });


// disable listen for testing
global.GRAPHQL_KOA_SCRIPTS_DISABLE_LISTEN = true;


// our files
const loader = require('./loaders');
const serve = require('./serve');

// needed? oke
module.exports.loader = loader;
module.exports.serve = serve;

// create server, pass a string file, or App (object or function)
module.exports.Server = bluebird.method(async (App) => {
  let app = App;

  // if App passed as string filename/path
  if (typeof App === 'string') {
    const mainFile = path.resolve(App);
    if (!fs.existsSync(mainFile)) {
      throw new Error(`File: (${mainFile}) doesn't exists!`);
    }

    app = require(mainFile);
  }

  // load
  let dependencies = await loader();

  // hold all apollo server to make testing easier
  const apolloClients = {};
  dependencies.hook.on('http:graphqlHandler:added', ({ server, options: { endpointUrl } }) => {
    apolloClients[endpointUrl] = createTestClient(server);
  });

  // serve
  dependencies = await serve(dependencies, app);

  return { ...dependencies, apolloClients };
});
