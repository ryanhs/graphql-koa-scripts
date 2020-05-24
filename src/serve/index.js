const makeApp = require('./makeApp');
const addHealthcheck = require('./addHealthcheck');
const listenHttp = require('./listenHttp');

// need dependencies from loader
module.exports = (d, App) => d.bluebird.resolve(d)

  // make App
  .then((dependencies) => makeApp(dependencies, App))

  // addHealthcheck
  .tap((dependencies) => dependencies.DISABLE_HEALTHCHECK || addHealthcheck(dependencies))

  // listenHttp
  .tap((dependencies) => dependencies.DISABLE_LISTEN || listenHttp(dependencies));
