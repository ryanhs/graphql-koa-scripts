module.exports = async function listenHttp({
  koa, hook, logger, DISABLE_LISTEN, PORT,
}) {
  // skip listen, if necessary
  if (DISABLE_LISTEN) return {};

  // listen
  const port = PORT || process.env.PORT || 4001;

  hook.emit('http:listen:before', { port });

  const httpServer = koa.listen(port, () => {
    logger.info(`🚀 HTTP ready on port: ${port}`);
    hook.emit('http:listen:after', { httpServer, port });
  });

  return { httpServer };
};
