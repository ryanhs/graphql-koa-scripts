const Router = require('@koa/router');
const Loader = require('../../src/loaders');

describe('it load everything needed', () => {
  it('initialize', async () => {
    // initialize
    const { koa, koaRouter, hook, graphqlPubSub, bluebird, graphqlHandler } = await Loader();

    // check koa
    expect(koa.toJSON()).toMatchObject({
      subdomainOffset: 2,
      proxy: false,
      env: 'development',
    });

    // check router
    expect(koaRouter).toBeInstanceOf(Router);

    // check Hook and global hook
    expect(hook).toBe(global.Hook);

    // check PubSub
    expect(graphqlPubSub).toBe(global.graphqlPubSub);

    // check bluebird
    await expect(bluebird.resolve()).resolves.not.toThrow();

    // check graphqlHandler
    expect(graphqlHandler).toBeInstanceOf(Function);
  });
});
