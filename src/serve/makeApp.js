module.exports = async (d, App) => {
  let dependencies = { ...d };
  const { hook } = d;

  await hook.emit('makeApp:before', dependencies);

  // if app is function, and need dependencies, then give it
  const app =
    typeof App === 'function'
      ? await Promise.resolve(App(dependencies)) // async enabled
      : App;

  // App configure? combine dependencies then.
  if (typeof app.configure === 'function') {
    await hook.emit('makeApp:configure:before', dependencies);

    dependencies = { ...dependencies, ...app.configure(dependencies) };
    dependencies.logger.trace('App configure called!', { service: 'configure' });

    await hook.emit('makeApp:configure:after', dependencies);
  }

  // if app wants router, then pass it
  if (app.router) {
    await hook.emit('makeApp:router:before', dependencies);

    await app.router(dependencies.koaRouter, dependencies);

    await hook.emit('makeApp:router:after', dependencies);
  }

  // register hooks
  if (Array.isArray(app.hooks)) {
    // fn or listener is ok
    app.hooks.forEach(({ on, priority = 0, fn, listener }) => {
      dependencies.hook.on(on, priority, fn || listener);
      dependencies.logger.trace({
        service: 'hook',
        registered: on,
        by: 'App',
        priority,
      });
    });
  }

  await hook.emit('makeApp:after', dependencies);

  return { ...dependencies, app }; // add app to dependencies
};
