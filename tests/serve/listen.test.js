const Promise = require('bluebird');
const getFreePort = require('find-free-port');
const superagent = require('superagent');

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
    PORT: (await getFreePort(20000))[0],
    koa,
    koaRouter,
    hook,
    logger,
  };
};

describe('it listen http', () => {
  it('listen called', async () => {
    const dependencies = await buildDeps();

    const helloWorld = function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write('Hello_World');
      res.end();
    };
    const helloWorldWrapper = { helloWorld };
    const spy = jest.spyOn(helloWorldWrapper, 'helloWorld');

    const koa = {
      callback: () => helloWorldWrapper.helloWorld,
    };

    await listenHttp({ ...dependencies, koa });
    const s = await superagent(`http://localhost:${dependencies.PORT}/`);

    expect(s.text).toBe('Hello_World');
    expect(spy).toHaveBeenCalled();

    await dependencies.hook.emit('quit');
  });
});
