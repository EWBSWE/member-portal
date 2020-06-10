import * as express from "express";
import * as passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { signToken } from "./auth.service";
import { db } from "../Db";
import { SqlProvider } from "../SqlProvider";
import { authenticate } from "../user/PasswordService";
import { PgUserEntity } from "../user/PgUserEntity";

const router = express.Router();

const failedToSignIn = { message: "Failed to sign in." };

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    (email, password, done) => {
      db.oneOrNone<PgUserEntity>(SqlProvider.UserByEmail, email)
        .then((maybe: PgUserEntity | null) => {
          if (maybe == null) return done(null, false, failedToSignIn);

          const correctPassword = authenticate(
            password,
            maybe.salt,
            maybe.hashed_password
          );

          if (correctPassword) {
            done(null, maybe);
          } else {
            done(null, false, failedToSignIn);
          }
        })
        .catch((err) => {
          done(null, false, failedToSignIn);
        });
    }
  )
);

router.post("/local", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    const error = err || info;
    if (error) return res.status(401).json(error);
    if (!user)
      return res
        .status(404)
        .json({ message: "Something went wrong, please try again" });

    const token = signToken(user.id);
    res.json({ token });
  })(req, res, next);
});

export default router;
