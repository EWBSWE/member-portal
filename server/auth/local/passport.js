var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var db = require('../../db').db;

exports.setup = (Member, config) => {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password' // this is the virtual field on the model
        }, (email, password, done) => {
            db.oneOrNone(`
                SELECT hashed_password, salt
                FROM member
                WHERE email = $1
            `, email).then(data => {
                if (!data) {
                    return done(null, false, {message: 'Failed to sign in.'});
                }
                if (!Member.authenticate(password, data.hashedpassword, data.salt)) {
                    return done(null, false, {message: 'Failed to sign in.'});
                }

                return done(null, data);
            }).catch(err => {
                console.log(err);
                return done(null, false, {message: 'Failed to sign in.'});
            });
        })
    );
};
