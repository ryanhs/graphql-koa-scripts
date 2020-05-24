const Promise = require('bluebird');

const HookEmitter = require('hook-emitter').default;
const Bunyan = require('bunyan');
const KoaApp = require('../../src/loaders/koa');

const listenHttp = require('../../src/serve/listenHttp');

const buildDeps = async () => {
  const { koa, koaRouter } = await KoaApp();
  const hook = new HookEmitter();
  const logger = Bunyan.createLogger({
    name: 'jest',
    streams: [
      {
        level: 'trace',
        type: 'raw', // use 'raw' to get raw log record objects
        stream: new Bunyan.RingBuffer({ limit: 100 }),
      },
    ],
    serializers: Bunyan.stdSerializers,
    level: 'trace',
  });

  return {
    koa,
    koaRouter,
    hook,
    logger,
  };
};

describe('it listen http ', () => {
  it('listen called', async () => {
    const dependencies = await buildDeps();
    const koa = {
      listen: jest.fn().mockReturnValue('server'),
    };

    await expect(listenHttp({ ...dependencies, koa })).resolves.toMatchObject({
      httpServer: 'server',
    });
  });

  it('check hook', async () => {
    let callback;

    const dependencies = await buildDeps();
    const koa = {
      listen: (port, cb) => {
        callback = cb;
        return 'server';
      },
    };

    // trap hook
    let listenBefore = 0;
    let listenAfter = 0;
    dependencies.hook.on('http:listen:before', () => {
      listenBefore += 1;
    });
    dependencies.hook.on('http:listen:after', () => {
      listenAfter += 1;
    });

    await expect(listenHttp({ ...dependencies, koa })).resolves.not.toThrow();

    // call callback
    callback();
    expect(listenBefore).toBe(1);
    expect(listenAfter).toBe(1);
  });
});
