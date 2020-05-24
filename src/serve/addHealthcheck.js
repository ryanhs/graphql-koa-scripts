const ping = require('../defaults/ping');

module.exports = async ({ koaRouter, graphqlPubSub, hook }) => {
  // healthchecks ping
  koaRouter.get('/healthcheck', ping);
  koaRouter.get('/ping', ping);
  koaRouter.get('/api/ping', ping);

  // PubSub every 3s, just to make sure app alive!
  const interval = setInterval(() => {
    const channel = 'all';
    const payload = { healthcheck: `alive! ${new Date().toISOString()}` };
    graphqlPubSub.publish(channel, payload);
  }, 3000);

  hook.emit('healthcheck:added', { interval });
  hook.on('quit', () => clearInterval(interval));

  return { interval };
};
