const flaverr = require('flaverr');
const formatError = require('../../src/handlers/graphqlFormatError');

describe('format error, including flaverr powered', () => {

  it('just throw without message', () => {
    const formatted = formatError(new Error());

    expect(formatted).toMatchObject({
      message: 'Unexpected error occurred!',
      code: 'E_UNKNOWN_ERROR',
      httpStatusCode: 500,
    });
  });

  it('without stack', () => {
    const formatted = formatError({});

    expect(formatted).toMatchObject({
      stack: [],
    });
  });

  it('normal error, E_UNKNOWN_ERROR - 500', () => {
    const formatted = formatError(new Error('Foobar'));

    expect(formatted).toMatchObject({
      message: 'Foobar',
      code: 'E_UNKNOWN_ERROR',
      httpStatusCode: 500,
    });
  });

  it.each([
    ['E_INVALID_ARGINS', 400],
    ['E_NOT_UNIQUE', 400],
    ['E_NOT_FOUND', 400],
    ['E_UNKNOWN_ERROR', 500],
    ['E_UNDOCUMENTED_JUST500', 500],
  ])('%s, to be %i', (code, httpStatusCode) => {
    const formatted = formatError(
      flaverr(
        {
          extensions: {
            exception: {
              code,
            },
          },
        },
        new Error('Foobar'),
      ),
    );

    expect(formatted).toMatchObject({
      message: 'Foobar',
      code,
      httpStatusCode,
    });
  });

  it('custom locations', () => {
    const formatted = formatError(
      flaverr(
        {
          locations: 'some location',
        },
        new Error('Foobar'),
      ),
    );

    expect(formatted).toMatchObject({
      locations: 'some location',
    });
  });

  it('custom path', () => {
    const formatted = formatError(
      flaverr(
        {
          path: 'some path',
        },
        new Error('Foobar'),
      ),
    );

    expect(formatted).toMatchObject({
      path: 'some path',
    });
  });

  it('check stacktrace', () => {
    const e = new Error('Foobar');
    const formatted = formatError(e);

    // just split
    expect(formatted.stack).toEqual(expect.arrayContaining(e.stack.split('\n')));
  });

  it('custom stacktrace', () => {
    const formatted = formatError(
      flaverr(
        {
          extensions: {
            exception: {
              code: 'E_INVALID_ARGINS',
              stacktrace: ['first', 'second'],
            },
          },
        },
        new Error('Foobar'),
      ),
    );

    expect(formatted).toMatchObject({
      message: 'Foobar',
      code: 'E_INVALID_ARGINS',
      httpStatusCode: 400,
    });

    expect(formatted.stack).toEqual(expect.arrayContaining(['first']));
    expect(formatted.stack).toEqual(expect.arrayContaining(['second']));
  });

});

describe('process.env.NODE_ENV aware', () => {

  it('should NODE_ENV=development should contain stack', () => {
    process.env.NODE_ENV = 'development';

    const formatted = formatError(new Error('Foobar'));

    expect(formatted).toMatchObject({
      stack: expect.any(Array),
    });
  });


  it('should NODE_ENV=production should NOT contain stack', () => {
    process.env.NODE_ENV = 'production';

    const formatted = formatError(new Error('Foobar'));

    expect(formatted.stack).toBeUndefined();
  });

});

describe('schema invalid aware', () => {

  it('"String cannot represent a non string value: ..." to be E_INVALID_ARGINS-400', () => {
    process.env.NODE_ENV = 'development';

    const formatted = formatError(new Error('String cannot represent a non string value: 21'));

    expect(formatted).toMatchObject({
      code: 'E_INVALID_ARGINS',
      httpStatusCode: 400,
    });
  });

  it('"Expected type ..." to be E_INVALID_ARGINS-400', () => {
    process.env.NODE_ENV = 'development';

    const formatted = formatError(new Error('Expected type Int but ...'));

    expect(formatted).toMatchObject({
      code: 'E_INVALID_ARGINS',
      httpStatusCode: 400,
    });
  });

  it('"... is required, but it was not provided." to be E_INVALID_ARGINS-400', () => {
    process.env.NODE_ENV = 'development';

    const formatted = formatError(new Error('name is required, but it was not provided.'));

    expect(formatted).toMatchObject({
      code: 'E_INVALID_ARGINS',
      httpStatusCode: 400,
    });
  });


});
