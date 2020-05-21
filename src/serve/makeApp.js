
module.exports = async (d, App) => {
  let dependencies = d;

  // if app is function, and need dependencies, then give it
  const app = typeof App === 'function'
    ? await Promise.resolve(App(dependencies)) // async enabled
    : App;


  // App configure? combine dependencies then.
  if (typeof app.configure === 'function') {
    dependencies = { ...dependencies, ...app.configure(dependencies) };
    dependencies.logger.trace('App configure called!', { service: 'configure' });
  }

  // if app wants router, then pass it
  if (app.router) {
    await app.router(dependencies.koaRouter, dependencies);
  }

  // register hooks
  if (Array.isArray(app.hooks)) {
    // fn or listener is ok
    app.hooks.forEach(({
      on, priority = 0, fn, listener,
    }) => {
      dependencies.hook.on(on, priority, fn || listener);
      dependencies.logger.trace({
        service: 'hook', registered: on, by: 'App', priority,
      });
    });
  }

  return { ...dependencies, app }; // add app to dependencies
};
