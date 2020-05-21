// this file intented to be run only by ./bin.js
/* eslint-disable import/no-dynamic-require */

const meow = require('meow');

// .env load
require('dotenv').config();

// our files
const loader = require('./loaders');
const serve = require('./serve');

// run the script
loader().then((dependencies) => serve(dependencies, require(meow().input[0])));
