const { TestServer } = require('../../../src');

const App = {};

describe('can create a server inline', () => {
  it('try health', async () => {
    const { quit, supertest } = await TestServer(App);
    const res = supertest.get('/healthcheck/health').type('json');
    await expect(res).resolves.toMatchObject({
      body: {
        status: 'UP',
      },
    });
    return quit();
  });

  it('try liveness', async () => {
    const { quit, supertest } = await TestServer(App);
    const res = supertest.get('/healthcheck/ready').type('json');
    await expect(res).resolves.toMatchObject({
      body: {
        status: 'UP',
      },
    });
    return quit();
  });

  it('try readyness', async () => {
    const { quit, supertest } = await TestServer(App);
    const res = supertest.get('/healthcheck/live').type('json');
    await expect(res).resolves.toMatchObject({
      body: {
        status: 'UP',
      },
    });
    return quit();
  });
});
