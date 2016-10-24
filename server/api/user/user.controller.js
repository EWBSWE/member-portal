'use strict';

var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var crypto = require('crypto');

//var User = require('../../models/user.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var ewbError = require('../../models/ewb-error.model');

var ewbMail = require('../../components/ewb-mail');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

exports.index = function(req, res) {
    User.find({}, '-salt -hashedPassword', function (err, users) {
        if(err) return res.send(500, err);
        res.status(200).json(users);
    });
};

exports.create = function (req, res, next) {
    if (!req.body.email) {
        return res.status().json({
            email: true,
        });
    }

    function createUser(email) {
        User.create({
            email: email,
            role: 'user',
            password: crypto.randomBytes(24).toString('hex'),
        }, function(err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            return notifyUser(user);
        });
    };

    function notifyUser(user) {
        // TODO fix this url
        var url = 'https://blimedlem.ingenjorerutangranser.se/login';
        OutgoingMessage.create({
            from: ewbMail.noreply(),
            to: user.email,
            subject: ewbMail.getSubject('create-user'),
            text: ewbMail.getBody('create-user', { url: url }),
        }, function(err, message) {
            if (err) {
                return res.status(500).send(err);
            }

            return res.status(200).json(user);
        });
    }

    User.findOne({ email: req.body.email.trim() }, function(err, maybeUser) {
        if (err) {
            return res.status(500).send(err);
        }

        if (maybeUser) {
            return res.status(400).json({
                email: true,
            });
        }

        return createUser(req.body.email.trim());
    });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

exports.destroy = function(req, res) {
    User.findByIdAndRemove(req.params.id, function(err, user) {
        if(err) return res.send(500, err);
        return res.send(204);
    });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401);
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

exports.resetPassword = function (req, res) {
  User.findOne({ email: req.body.email.trim() }, function (err, user) {
    if (err) {
      return res.status(500);
    }
    if (user) {
      user.resetValidity = moment().add(15, 'minutes');
      user.resetToken = crypto.randomBytes(24).toString('hex');
      user.save();

      var url = 'http://localhost:9000/reset-password?token=' + user.resetToken;
      if (process.env.NODE_ENV === 'production') {
        // TODO: Fix this URL
        url = 'https://blimedlem.ingenjorerutangranser.se/reset-password?token=' + user.resetToken;
      }

      OutgoingMessage.create({
        from: 'noreply@ingenjorerutangranser.se',
        to: user.email,
        subject: ewbMail.getSubject('reset-password'),
        text: ewbMail.getBody('reset-password', { url: url }),
      }, function (err, data) {
        if (err) {
          ewbError.create({ message: 'Reset password outgoing message', origin: __filename, params: err });
        }
        res.status(200).json();
      });
    } else {
      ewbError.create({ message: 'Reset password', origin: __filename, params: { email: req.body.email } }, function (err, ewbError) {
        if (err) {
          return res.status(500);
        }
        res.status(200).json();
      });
    }
  });
};

exports.resetPasswordWithToken= function (req, res) {
  //@warning: search by indexed variables instead? Query not indexable as resetToken and resetValidity are not required in model.
  User.findOne({ resetToken: req.body.token, resetValidity: { $gt: moment() } }, function (err, user) {
    if (err) {
      ewbError.create({ message: 'Reset password with token', origin: __filename, params: err });
    }

    if (user === null) {
      return res.status(200).json();
    }

    user.resetToken = null;
    user.password = req.body.newPassword;
    user.save(function(err) {
      if (err) {
        return validationError(res, err);
      }
      return res.status(200).json();
    });
  });
};
