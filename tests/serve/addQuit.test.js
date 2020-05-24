const HookEmitter = require('hook-emitter').default;
const addQuit = require('../../src/serve/addQuit');

describe('emit quit', () => {
  it('just emit quit hook', async () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();
    const hook = new HookEmitter();

    hook.on('quit', fn1);
    hook.on('quit', fn2);
    hook.on('quit', fn3);

    const { quit } = await addQuit({ hook });

    expect(fn1).toHaveBeenCalledTimes(0);
    expect(fn2).toHaveBeenCalledTimes(0);
    expect(fn3).toHaveBeenCalledTimes(0);

    await expect(quit()).resolves.not.toThrow();

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalledTimes(1);
  });
});
