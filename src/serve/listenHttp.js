const http = require('http');

module.exports = async function listenHttp({ koa, hook, logger, PORT }) {
  const httpServer = http.createServer();
  const port = PORT || process.env.PORT || 4001;

  // before listen, announce httpServer instance
  await hook.emit('http:listen:before', { httpServer, port });

  // listen
  httpServer.on('request', koa.callback());
  await new Promise((resolve) => httpServer.listen({ port }, resolve)); //eslint-disable-line

  logger.info(`🚀 HTTP ready on port: ${port}`, { service: 'http' });
  hook.emit('http:listen:after', { httpServer, port });

  // on quit
  hook.on(
    'quit',
    () =>
      new Promise((cb) => {
        logger.info('stopping http server...', { service: 'http' });
        httpServer.close(cb);
      }),
  );

  return { httpServer };
};
