module.exports = (ctx) => {
  const now = new Date().toISOString();

  ctx.body = (process.env.NODE_ENV === 'production')
    ? now
    : `${now} @${process.env.NODE_ENV}`;
};
