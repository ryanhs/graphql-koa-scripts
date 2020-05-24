const http = require('http');
const request = require('supertest');
const Router = require('@koa/router');
const Loader = require('../../src/loaders');
const makeApp = require('../../src/serve/makeApp');

describe('make the App', () => {
  it('empty app {}', async () => {
    const dependencies = await Loader();

    const newDependencies = await makeApp(dependencies, {});

    // no changes
    expect(newDependencies).toMatchObject(dependencies);
  });

  it('app as function', async () => {
    const dependencies = await Loader();

    const App = jest.fn().mockReturnValue({});

    const newDependencies = await makeApp(dependencies, App);

    // app called
    expect(App).toHaveBeenCalled();

    // no changes
    expect(newDependencies).toMatchObject(dependencies);
  });

  it('app as async function', async () => {
    const dependencies = await Loader();

    const App = jest.fn().mockResolvedValue({});

    const newDependencies = await makeApp(dependencies, App);

    // app called
    expect(App).toHaveBeenCalled();

    // no changes
    expect(newDependencies).toMatchObject(dependencies);
  });

  it('can configure, replace logger', async () => {
    const dependencies = await Loader();

    const mock = jest.fn();

    const App = {
      configure: () => ({
        logger: {
          modified: true,
          trace: mock,
          info: mock,
          warn: mock,
          error: mock,
        },
      }),
    };

    const newDependencies = await makeApp(dependencies, App);

    // configure called
    expect(mock).toHaveBeenCalled();

    // no changes
    expect(newDependencies.logger).not.toBe(dependencies.logger);
    expect(newDependencies.logger.modified).toBe(true);
  });

  it('add router', async () => {
    const App = {
      router(r) {
        r.get('/foo', (ctx) => {
          ctx.body = 'bar';
        });
      },
    };
    const { koa } = await makeApp(await Loader(), App);

    await request(http.createServer(koa.callback()))
      .get('/foo')
      .expect(200)
      .then((res) => {
        expect(res.text).toBe('bar');
      });
  });

  it('add hooks simple', async () => {
    const App = {
      hooks: [
        { on: 'test1', fn: () => null },
        { on: 'test2', fn: () => null },
      ],
    };
    const { hook } = await makeApp(await Loader(), App);

    expect(hook.events.keys()).toContain('test1');
    expect(hook.events.keys()).toContain('test2');
  });

  it('add hooks priority', async () => {
    const mock = jest.fn();
    const App = {
      hooks: [
        { on: 'test1', priority: 111, fn: mock },
        { on: 'test1', priority: 222, listener: mock },
      ],
    };
    const { hook } = await makeApp(await Loader(), App);

    // contain priority
    const priorities = Array.from(hook.events.values())[0].map((v) => v.priority);
    expect(priorities).toContain(111);
    expect(priorities).toContain(222);
  });

  it('add hooks fn | listener', async () => {
    const mock = jest.fn();
    const App = {
      hooks: [
        { on: 'test1', priority: 111, fn: mock },
        { on: 'test1', priority: 222, listener: mock },
      ],
    };
    const { hook } = await makeApp(await Loader(), App);

    // called
    hook.emit('test1');
    expect(mock).toHaveBeenCalledTimes(2);
  });
});
