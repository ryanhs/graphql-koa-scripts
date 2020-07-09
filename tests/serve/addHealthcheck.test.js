const Promise = require('bluebird');
const HookEmitter = require('hook-emitter').default;
const Router = require('@koa/router');
const { PubSub: GraphqlPubSub } = require('graphql-subscriptions');

const KoaApp = require('../../src/loaders/koa');
const addHealthcheck = require('../../src/serve/addHealthcheck');

describe('it add healthcheck functions ', () => {
  const graphqlPubSub = new GraphqlPubSub();

  it('add healthcheck', async () => {
    // initialize
    const hook = new HookEmitter();
    const { koa, koaRouter } = await KoaApp();

    // still fresh
    expect(koaRouter.stack).toHaveLength(0);

    // trap
    const mock = jest.fn();
    hook.on('healthcheck:added', mock);

    // inject
    const { interval } = await addHealthcheck({ koaRouter, graphqlPubSub, hook });
    expect(koaRouter.stack.length).toBeGreaterThanOrEqual(3);

    // check healthcheck publish
    return new Promise((resolve) => {
      graphqlPubSub.subscribe('all', (payload) => {
        expect(payload).toMatchObject({
          healthcheck: expect.any(String),
        });

        expect(mock).toHaveBeenCalled();
        expect(mock.mock.calls[0][0]).toMatchObject({
          interval: expect.anything(),
        });

        clearInterval(interval);
        resolve();
      });
    });
  });
});
