'use strict';

const path = require('path');
const Rollbar = require('rollbar');
const winston = require('winston');

winston.emitErrors = true;

class RollbarTransport extends winston.Transport {
  constructor(opts) {
    super(opts);

    if (!opts.accessToken) {
      throw new Error('Rollbar access token missing');
    }

    this.rollbar = new Rollbar({
      accessToken: opts.accessToken,
      captureUncaught: true,
      captureUnhandledRejections: true
    });
  }

  log(level, message, meta, callback) {
    this.rollbar[level](message, meta.stack);

    callback();
  }
}

class DebugTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
  }

  log(level, message, meta, callback) {
    console.log(message);

    if (Array.isArray(meta.stack)) {
      console.log(meta.stack.join('\n'));
    }

    callback();
  }
}

const transports = [];

if (process.env.NODE_ENV === 'production') {
  transports.push(new winston.transports.File({
    level: 'info',
    filename: process.env.EWB_LOG_PATH || path.join(__dirname, '../../logs/all-logs.log'),
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false
  })
  );
  transports.push(new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  }));
  transports.push(new RollbarTransport({
    name: 'Rollbar',
    level: 'warning',
    handleExceptions: true,
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN
  }));
} else {
  transports.push(new DebugTransport({
    name: 'Debug',
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  }));
}

const logger = new winston.Logger({
  transports: transports,
  exitOnError: false,
});

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};
