import * as express from "express";
import { ValidationResult, valid } from "./RequestValidation";
import { Result } from "./Result";
import logger = require("./config/logger");

type ExpressFunction = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void;

export function createHandler<T, U>(
  extract: (req: express.Request) => any,
  parse: (params: any) => ValidationResult<T>,
  endpoint: (t: T) => Promise<Result<U>>
): ExpressFunction {
  return async function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const extracted = extract(req);
    const params = parse(extracted);

    if (!params.success) {
      logger.error(req.url + "\n" + params.error.message);
      return res.status(400).json({ message: params.error.message });
    }

    try {
      const result = await endpoint(params.value);

      if (result.success && result.hasData) {
        res.status(200).json(result.data);
      } else if (result.success) {
        res.sendStatus(200);
      } else {
        logger.error(req.url + "\n" + result.message);
        res.status(400).json({ message: result.message });
      }
    } catch (e) {
      e.message = req.url + "\n" + e.message;
      logger.error(e);
      next(e);
    }
  };
}

// helper handler for endpoints w/o args
export function createHandlerNoInput<U>(endpoint: () => Promise<Result<U>>) {
  return createHandler<void, U>(
    (req: express.Request) => undefined,
    (params: any) => valid(undefined),
    endpoint
  );
}
