const health = require('@cloudnative/health');
const ping = require('../defaults/ping');

const StateCode = {
  OK: 200,
  DOWN: 503,
  ERRORED: 500,
};

module.exports = async ({ koaRouter, graphqlPubSub, hook }) => {
  // healthcheck setup
  const healthcheck = new health.HealthChecker();
  await hook.emit('healthcheck:setup', { health, healthcheck });
  hook.on('quit', () => healthcheck.onShutdownRequest());

  async function healthHandler(ctx) {
    const status = await healthcheck.getStatus();
    /* eslint-disable */
    switch (status.status) {
      case health.State.STARTING:    ctx.status = StateCode.DOWN; break;
      case health.State.UP:          ctx.status = StateCode.OK;   break;
      case health.State.DOWN:        ctx.status = StateCode.DOWN; break;
      case health.State.STOPPING:    ctx.status = StateCode.DOWN; break;
      case health.State.STOPPED:     ctx.status = StateCode.DOWN; break;
    }
    /* eslint-enable */
    ctx.body = status;
  }

  async function livenessHandler(ctx) {
    const status = await healthcheck.getLivenessStatus();
    /* eslint-disable */
    switch (status.status) {
      case health.State.STARTING:    ctx.status = StateCode.OK;   break;
      case health.State.UP:          ctx.status = StateCode.OK;   break;
      case health.State.DOWN:        ctx.status = StateCode.DOWN; break;
      case health.State.STOPPING:    ctx.status = StateCode.DOWN; break;
      case health.State.STOPPED:     ctx.status = StateCode.DOWN; break;
    }
    /* eslint-enable */
    ctx.body = status;
  }

  async function readinessHandler(ctx) {
    const status = await healthcheck.getReadinessStatus();
    /* eslint-disable */
    switch (status.status) {
      case health.State.STARTING:    ctx.status = StateCode.DOWN;   break;
      case health.State.UP:          ctx.status = StateCode.OK;     break;
      case health.State.DOWN:        ctx.status = StateCode.DOWN;   break;
      case health.State.STOPPING:    ctx.status = StateCode.DOWN;   break;
      case health.State.STOPPED:     ctx.status = StateCode.DOWN;   break;
    }
    /* eslint-enable */
    ctx.body = status;
  }

  koaRouter.get('/healthcheck/live', livenessHandler);
  koaRouter.get('/healthcheck/ready', readinessHandler);
  koaRouter.get('/healthcheck/health', healthHandler);
  koaRouter.get('/healthcheck', healthHandler);

  // healthchecks by ping
  koaRouter.get('/ping', ping);
  koaRouter.get('/api/ping', ping);

  // PubSub every 3s, just to make sure app alive!
  const interval = setInterval(() => {
    const channel = 'all';
    const payload = { healthcheck: `alive! ${new Date().toISOString()}` };
    graphqlPubSub.publish(channel, payload);
  }, 3000);

  await hook.emit('healthcheck:added', { interval, health, healthcheck });
  hook.on('quit', () => clearInterval(interval));

  return { interval };
};
