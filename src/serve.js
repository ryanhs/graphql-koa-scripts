// need dependencies from loader
module.exports = (d, App) => bluebird.resolve(d)
  // if app is function, and need dependencies, then give if
  .then(async (dependencies) => {
    const app = typeof App === 'function'
      ? await Promise.resolve(App(dependencies)) // async enabled
      : App;

    // register hooks
    if (Array.isArray(app.hooks)) {
      app.hooks.forEach(({ on, fn }) => {
        dependencies.hook.on(on, fn);
        sdk.log.trace({ service: 'hook', registered: on, by: 'App' });
      });
    }

    return { ...dependencies, app }; // add app to dependencies
  })

  // combine them all
  .tap(async ({ app, koa, koaRouter }) => {
    // healthchecks ping
    koaRouter.get('/healthcheck', require('./defaults/ping'));
    koaRouter.get('/ping', require('./defaults/ping'));
    koaRouter.get('/api/ping', require('./defaults/ping'));
    setInterval(() => {
      const channel = 'all';
      const payload = { healthcheck: `alive! ${new Date().toISOString()}` };
      graphqlPubSub.publish(channel, payload);
      // sdk.log.trace({ service: 'graphqlPubSub', channel, payload });
    }, 3000); // every 3s, just to make sure I'm alive


    // if app wants router, then pass it
    if (app.router) {
      await app.router(koaRouter);
    }

    // listen
    const port = process.env.PORT || 4001;
    Hook.emit('http:listen:before', { port });
    const httpServer = koa.listen(port, () => sdk.log.info(`🚀 HTTP ready on port: ${port}`));
    Hook.emit('http:listen:after', { httpServer, port });
  });
