const Koa = require('koa');
const Router = require('@koa/router');

// initialize simple koa app
module.exports = () => {
  const koa = new Koa();
  const koaRouter = new Router();

  koa.use(koaRouter.routes());
  return { koa, koaRouter };
};
