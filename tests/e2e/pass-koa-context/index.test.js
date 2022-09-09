const superagent = require('superagent');
const { Server } = require('../../../src');

describe('can create a server', () => {

  it('try graphql', async () => {
    const { quit, PORT } = await Server(`${__dirname}/app.js`);

    const res = superagent.post(`http://localhost:${PORT}/graphql`).type('json').send({
      query: '{ hello }',
    });

    // console.log((await res).body);
    await expect(res).resolves.toMatchObject({
      body: {
        data: {
          hello: 'hello dadang1!',
        },
      },
    });

    return quit();
  });
});
