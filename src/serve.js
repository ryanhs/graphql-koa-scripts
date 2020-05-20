// need dependencies from loader
module.exports = (d, App) => bluebird.resolve(d)

  // if app is function, and need dependencies, then give if
  .then(async (deps) => {
    const app = typeof App === 'function'
      ? await Promise.resolve(App(deps)) // async enabled
      : App;

    let dependencies = deps;

    // App configure? combine dependencies then.
    if (typeof app.configure === 'function') {
      dependencies = { ...deps, ...app.configure(deps) };
      sdk.log.trace('App configure called!', { service: 'configure' });
    }

    // register hooks
    if (Array.isArray(app.hooks)) {
      // fn or listener is ok
      app.hooks.forEach(({
        on, priority = 0, fn, listener,
      }) => {
        dependencies.hook.on(on, priority, fn || listener || (() => {}));
        sdk.log.trace({
          service: 'hook', registered: on, by: 'App', priority,
        });
      });
    }

    return { ...dependencies, app }; // add app to dependencies
  })

  // combine them all
  .tap(async (deps) => {
    const {
      app, koa, koaRouter, graphqlPubSub,
    } = deps;

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
      await app.router(koaRouter, deps);
    }

    // skip listen, if necassary
    if (global.GRAPHQL_KOA_SCRIPTS_DISABLE_LISTEN) return;

    // listen
    const port = process.env.PORT || 4001;
    Hook.emit('http:listen:before', { port });
    const httpServer = koa.listen(port, () => {
      sdk.log.info(`🚀 HTTP ready on port: ${port}`);
      Hook.emit('http:listen:after', { httpServer, port });
    });
  });
