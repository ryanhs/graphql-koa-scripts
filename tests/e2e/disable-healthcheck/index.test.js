const { TestServer } = require('../../../src');

describe('check health not found ', () => {
  it('no /healthcheck', async () => {
    const App = {
      configure: () => ({ DISABLE_HEALTHCHECK: true }),
    };

    const { supertest, quit } = await TestServer(App);

    const response = supertest.get('/healthcheck');
    await expect(response).resolves.toMatchObject({ statusCode: 404 });

    return quit();
  });

  it('no /ping & /api/ping', async () => {
    const App = {
      configure: () => ({ DISABLE_HEALTHCHECK: true }),
    };

    const { supertest, quit } = await TestServer(App);

    let response;

    response = supertest.get('/ping');
    await expect(response).resolves.toMatchObject({ statusCode: 404 });

    response = supertest.get('/api/ping');
    await expect(response).resolves.toMatchObject({ statusCode: 404 });

    return quit();
  });

  it('no emit hook healthcheck:added', async () => {
    const mock = jest.fn();

    const App = {
      configure: () => ({ DISABLE_HEALTHCHECK: true }),
      hooks: [{ on: 'healthcheck:added', fn: mock }],
    };

    const { quit } = await TestServer(App);

    expect(mock).not.toHaveBeenCalled();

    return quit();
  });
});
