import * as jwt from "jsonwebtoken";
import * as express from "express";

import { secrets, userRoles } from "../config/environment";
import { db } from "../Db";
import { SqlProvider } from "../SqlProvider";
import { PgUserEntity } from "../user/PgUserEntity";

export function signToken(id: number): string {
  return jwt.sign({ _id: id }, secrets.session, {
    expiresIn: 60 * 60 * 5,
  });
}

function extractToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  // header looks like: "Bearer here-is-some-token"
  const token = authHeader.split(" ");
  if (token.length === 1) return null;
  return token[1];
}

export function isAuthenticated(): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<any> {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const token = extractToken(req);
    if (!token) return res.sendStatus(401);

    try {
      const decoded: any = jwt.verify(token, secrets.session);
      const maybeUser = await db.oneOrNone<PgUserEntity>(
        SqlProvider.UserById,
        decoded._id
      );
      if (maybeUser == null) return res.sendStatus(401);
      req.user = maybeUser;
      next();
    } catch (e) {
      res.sendStatus(401);
    }
  };
}

export function hasRole(
  roleRequired: string
): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => any {
  if (!userRoles.includes(roleRequired))
    throw new Error(
      `Expected any role of ${userRoles} but got ${roleRequired}`
    );

  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const user = req.user as any;
    const validRole = userRoles.includes(user.role);
    const roleMatchesRequirement = user.role === roleRequired;
    if (validRole && roleMatchesRequirement) next();
    else res.sendStatus(403);
  };
}
