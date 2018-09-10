'use strict';

const logger = require('./config/logger');

class RouteBuilder {
  constructor(endpoint) {
    this._endpoint = endpoint;
    this._requiredParams = [];
  }

  requiredParams(params) {
    this._requiredParams = params;
    return this;
  }

  build() {
    if (!this._endpoint) {
      throw new Error('Missing endpoint!');
    }

    const requiredParams = this._requiredParams;
    const endpoint = this._endpoint;

    const route = async function(req, res, next) {
      const missingParams = requiredParams.filter(p => typeof req.body[p] === 'undefined');
      if (missingParams.length > 0) {
	const badRequest = new Error(`Missing parameters [${missingParams.join(', ')}]`);
	badRequest.status = 400;
	return next(badRequest);
      }

      try {
	const result = await endpoint(req.body);
	return res.status(200).json(result);
      } catch (err) {
	return next(err);
      }
    };

    return route;
  }
}

module.exports = RouteBuilder;
