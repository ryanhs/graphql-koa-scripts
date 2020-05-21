const Router = require('@koa/router');
const KoaApp = require('../../src/loaders/koa');

describe('it can create new koa app with router', () => {

  it('initialize', () => {

    // initialize
    const { koa, koaRouter } = KoaApp();

    // check koa
    expect(koa.toJSON()).toMatchObject({
      subdomainOffset: 2,
      proxy: false,
      env: 'development',
    });

    // check router
    expect(koaRouter).toBeInstanceOf(Router);
  });

});
