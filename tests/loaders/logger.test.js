const Logger = require('../../src/loaders/logger');

describe('it can create new bunyan instance', () => {
  it('initialize default: isProduction = true', () => {
    // initialize
    const logger = Logger({});

    // production no src
    expect(logger.src).toBe(false);
  });

  it('initialize set: isProduction false', () => {
    const logger = Logger({ isProduction: false });
    expect(logger.src).toBe(true);
  });

  it('initialize set: isProduction true', () => {
    const logger = Logger({ isProduction: true });
    expect(logger.src).toBe(false);
  });
});
