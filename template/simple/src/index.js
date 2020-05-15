
module.exports = ({ graphqlHandler }) => {
  return ({

    // use koa-router
    router(r) {

      // test qs
      r.get('/qs', (ctx) => { ctx.body = ctx.query; });

      // its ok to add handlers here
      graphqlHandler(require('./graphql.js'));

    },

    hooks: [
      // { on: 'http:listen:before', fn: () => sdk.log.info('http:listen:before!!!'), },
      // { on: 'http:listen:after', fn: () => sdk.log.info('http:listen:after!!!'), },
    ],

  });
};
