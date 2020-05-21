const Bunyan = require('bunyan');

// initialize bunyan
module.exports = ({ isProduction = true }) => Bunyan.createLogger({
  name: process.env.APP_NAME || process.env.SDK_APP_NAME || 'graphql-koa-scripts',
  streams: [{
    stream: process.stdout,
    level: isProduction ? 'info' : 'trace',
  }],
  serializers: Bunyan.stdSerializers,
  level: isProduction ? 'info' : 'trace',
  src: !isProduction,
});
