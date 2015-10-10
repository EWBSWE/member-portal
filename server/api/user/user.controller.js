'use strict';

var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var crypto = require('crypto');

var User = require('../../models/user.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var ewbError = require('../../models/ewb-error.model');

var ewbMail = require('../../components/ewb-mail');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
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

/**
 * Deletes a user
 * restriction: 'admin'
 */
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
      user.resetValidity = moment().add('15 minutes');
      user.resetToken = crypto.randomBytes(24).toString('hex');
      user.save();

      OutgoingMessage.create({
        from: 'noreply@ingenjorerutangranser.se',
        to: user.email,
        subject: 'reset test',
        text: 'reset text',
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
