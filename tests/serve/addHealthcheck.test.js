const Promise = require('bluebird');
const Router = require('@koa/router');
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');

const KoaApp = require('../../src/loaders/koa');
const addHealthcheck = require('../../src/serve/addHealthcheck');


describe('it add healthcheck functions ', () => {

  const graphqlPubSub = new GraphqlPubSub();


  it('add healthcheck', async () => {

    // initialize
    const { koa, koaRouter } = await KoaApp();

    // still fresh
    expect(koaRouter.stack).toHaveLength(0);

    // inject
    const { interval } = await addHealthcheck({ koaRouter, graphqlPubSub });
    expect(koaRouter.stack).toHaveLength(3);

    // check healthcheck publish
    return new Promise(resolve => {
      graphqlPubSub.subscribe('all', (payload) => {

        expect(payload).toMatchObject({
          healthcheck: expect.any(String)
        })
        clearInterval(interval);
        resolve();
      })
    })

  });

});
