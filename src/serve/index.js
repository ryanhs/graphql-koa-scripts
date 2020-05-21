const makeApp = require('./makeApp');
const addHealthcheck = require('./addHealthcheck');

// need dependencies from loader
module.exports = (d, App) => d.bluebird.resolve(d)

  // make App
  .then((dependencies) => makeApp(dependencies, App))

  // addHealthcheck
  .tap((dependencies) => addHealthcheck(dependencies))

  // combine them all
  .tap(async ({ koa, hook, logger }) => {

    // skip listen, if necessary
    if (global.GRAPHQL_KOA_SCRIPTS_DISABLE_LISTEN) return;

    // listen
    const port = process.env.PORT || 4001;
    hook.emit('http:listen:before', { port });
    const httpServer = koa.listen(port, () => {
      logger.info(`🚀 HTTP ready on port: ${port}`);
      hook.emit('http:listen:after', { httpServer, port });
    });
  });
