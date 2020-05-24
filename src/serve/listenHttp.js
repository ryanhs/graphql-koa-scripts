module.exports = async function listenHttp({ koa, hook, logger, PORT }) {
  // listen
  const port = PORT || process.env.PORT || 4001;

  hook.emit('http:listen:before', { port });

  const httpServer = koa.listen(port, () => {
    logger.info(`🚀 HTTP ready on port: ${port}`, { service: 'http' });
    hook.emit('http:listen:after', { httpServer, port });
  });

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
