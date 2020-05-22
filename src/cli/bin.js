#!/usr/bin/env node
/* eslint-disable no-tabs */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable brace-style */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const meow = require('meow');
const nodemon = require('nodemon');

// .env load
require('dotenv').config();

// our files
const loader = require('../loaders');
const serve = require('../serve');

const cli = meow(`
	Usage
	  $ graphql-koa-scripts <command> <mainFile>

	Commands
	  start  Run mainFile
	  debug  Go to REPL console, provided with serve(mainFile), example: serve('src/index.js')

	Options
	  --dev, -watch  Run in watch mode (provided by nodemon)

	Examples
	  $ graphql-koa-scripts start src/index.js
	  $ graphql-koa-scripts start src/index.js --dev
`, {
  flags: {
    dev: {
      type: 'boolean',
      alias: 'watch',
      default: false,
    },
  },
});

// if debug
if (cli.input[0] === 'debug') {
  process.env.SDK_LOG_DEBUG_ENABLE = true;
  loader()
    .then((dependencies) => {
      global.serve = (App) => serve(dependencies, require(path.resolve(App)));
    })
    .then(() => require('repl').start({ prompt: '> ', useGlobal: true }));
}

// if start
else if (cli.input[0] === 'start' && cli.input[1]) {
  const mainFile = path.resolve(cli.input[1]);
  if (!fs.existsSync(mainFile)) {
	  throw new Error(`File: (${mainFile}) doesn't exists!`);
  }

  // load 'em all!
  if (!cli.flags.dev) {

    const App = require(mainFile);
    loader().then((dependencies) => serve(dependencies, App));

  } else {

    nodemon(`${__dirname}/dev.js ${mainFile}`)
      .on('restart', (files) => {
        console.log('App restarted due to: ', files);
      });

  }
}

// else?
else {
  cli.showHelp();
}
