const superagent = require('superagent');
const { Server } = require('../../../src');

describe('check disable listen ', () => {

  it('no listen', async () => {
    const App = ({
      configure: () => ({ DISABLE_LISTEN: true, PORT: 13003 }),
    });

    const { quit } = await Server(App);

    const res = superagent
      .get('http://localhost:13003/ping')
      .timeout({
        response: 2000, // Wait 2 seconds for the server to start sending,
        deadline: 2000,
      });

    await expect(res).rejects.toThrow(/ECONNREFUSED/g);

    return quit();
  });

  it('no emit hook http:listen:*', async () => {
    const mock = jest.fn();

    const App = ({
      configure: () => ({ DISABLE_LISTEN: true, PORT: 13003 }),
      hooks: [
        { on: 'http:listen:before', fn: mock },
        { on: 'http:listen:after', fn: mock },
      ]
    });

    const { quit } = await Server(App);

    expect(mock).not.toHaveBeenCalled();

    return quit();
  });

});
