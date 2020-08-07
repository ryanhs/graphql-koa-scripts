module.exports = (e) => {
  let code = 'E_UNKNOWN_ERROR';
  const message = e.message || 'Unexpected error occurred!';
  let httpStatusCode = 500;

  const { locations, path } = e;
  let stack = e.stack ? e.stack.split('\n') : [];

  // custom stack from extensions? oke lets go.
  if (e.extensions && e.extensions.exception && e.extensions.exception.stacktrace) {
    stack = stack.concat(e.extensions.exception.stacktrace);
  }

  // schema invalid
  if (
    message.match(/invalid value/g) !== null ||
    message.match(/Did you mean the enum value/g) !== null ||
    message.match(/was not provided/g) !== null ||
    message.match(/Expected type/g) !== null ||
    message.match(/String cannot represent a non string value/g) ||
    message.endsWith('is required, but it was not provided.') ||
    message.startsWith('Argument passed in must be')
  ) {
    code = 'E_INVALID_ARGINS';
  }

  // use flaverr({ code: ... }) ? oke lets go.
  if (e.extensions && e.extensions.exception && e.extensions.exception.code) {
    code = e.extensions.exception.code;
  }

  // parse statusCode
  const errorCode400 = ['E_INVALID_ARGINS', 'E_NOT_UNIQUE', 'E_NOT_FOUND'];
  if (errorCode400.indexOf(code) !== -1) {
    httpStatusCode = 400;
  }

  // tailor according env
  return process.env.NODE_ENV === 'development'
    ? {
        locations,
        path,
        message,
        code,
        httpStatusCode,
        stack,
      }
    : {
        locations,
        path,
        message,
        code,
        httpStatusCode,
      };
};
