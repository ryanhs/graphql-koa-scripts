const superagent = require('superagent');
const { Server } = require('../../../src');

describe('can create a server ', () => {

  it('boot up ok', async () => {
    const { quit } = await Server(`${__dirname}/app.js`);

    expect(1).toBe(1);

    return quit();
  });


  it('try graphql', async () => {
    const { quit } = await Server(`${__dirname}/app.js`);

    const res = superagent
      .post('http://localhost:14099/graphql')
      .type('json')
      .send({
        query: '{ hello }',
      });

    await expect(res).resolves.toMatchObject({
      body: {
        data: {
          hello: 'Awesome!',
        },
      },
    });

    return quit();
  });

});
