const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("../../db").db;
const { authenticate } = require("../../user/PasswordService");

exports.setup = (config) => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password", // this is the virtual field on the model
      },
      (email, password, done) => {
        db.oneOrNone(
          `
                SELECT id, hashed_password, salt, role
                FROM ewb_user
                WHERE username = $1
            `,
          email
        )
          .then((data) => {
            if (!data) {
              return done(null, false, { message: "Failed to sign in." });
            }
            if (!authenticate(password, data.salt, data.hashed_password)) {
              return done(null, false, { message: "Failed to sign in." });
            }

            return done(null, data);
          })
          .catch((err) => {
            return done(null, false, { message: "Failed to sign in." });
          });
      }
    )
  );
};
