'use strict'

const logger = require('./config/logger')

class RouteBuilder {
  constructor (endpoint) {
    this._endpoint = endpoint
    this._requiredParams = []
  }

  requiredParams (params) {
    this._requiredParams = params
    return this
  }

  build () {
    if (!this._endpoint) {
      throw new Error('Missing endpoint!')
    }

    logger.info(`Building endpoint ${this._endpoint.name}`)
    const requiredParams = this._requiredParams
    const endpoint = this._endpoint

    const route = async function (req, res, next) {
      // TODO(dan) 27/01/19: url validation is handled by express i believe..
      const missingParams = requiredParams.filter(p =>
        typeof req.body[p] === 'undefined'
      )

      if (missingParams.length > 0) {
        const badRequest = new Error(
          `Missing parameters [${missingParams.join(', ')}]`)
        badRequest.status = 400
        return next(badRequest)
      }

      // TODO: Finetune the logging of parameters, right now it is too
      // explicit, logging every parameter. Sensitive or not. Right
      // now only a few routes use the RouteBuilder.
      logger.info(`Endpoint ${endpoint.name} called with %j`, req.body)

      try {
        // TODO(dan) 27/01/19: not the nicest thing to add the URL params as the second parameter. Highly improvable for future me, yay.
        const result = await endpoint(req.body, req.params, req.query)
        return res.status(200).json(result)
      } catch (err) {
        return next(err)
      }
    }

    return route
  }
}

module.exports = RouteBuilder
