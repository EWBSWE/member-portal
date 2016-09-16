'use strict';

var crypto = require('crypto');
var Promise = require('bluebird');

var db = require('../db').db;
var config = require('../config/environment');

function create(email, password, role) {
    return txCreate(email, password, role, db);
}

function txCreate(email, password, role, transaction) {
    if (!validEmail(email)) {
        return new Promise((_, reject) => {
            reject('Invalid email');
        });
    }
    if (!validPassword(password)) {
        return new Promise((_, reject) => {
            reject('Password too short');
        });
    }
    if(!validRole(role)) {
        return new Promise((_, reject) => {
            reject('Invalid role')
        });
    }

    let salt = makeSalt();
    let hashedPassword = hashPassword(password, salt);

    let data = {
        email: email,
        role: role,
        hashedPassword: hashedPassword,
        salt: salt,
    };

    return transaction.one(`
        INSERT INTO member(email, hashed_password, salt, role)
        VALUES($[email], $[hashedPassword], $[salt], $[role])
        RETURNING id, email, hashed_password, salt, role
    `, data);
}

function validEmail(email) {
    if (!email) {
        return false;
    }

    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function validRole(role) {
    return role && config.userRoles.indexOf(role) > -1;
}

function validPassword(password) {
    return password && password.length >= 8;
}

//var mongoose = require('mongoose');
//var Schema = mongoose.Schema;

//var UserSchema = new Schema({
  //email: { type: String, lowercase: true, required: true },
  //role: {
    //type: String,
    //default: 'user',
    //required: true
  //},
  //hashedPassword: { type: String, required: true },
  //salt: { type: String, required: true },
  //resetValidity: { type: Date },
  //resetToken: { type: String },
//});

//UserSchema.index({email: 1});

/**
 * Virtuals
 */
//UserSchema
  //.virtual('password')
  //.set(function(password) {
    //this._password = password;
    //this.salt = this.makeSalt();
    //this.hashedPassword = this.encryptPassword(password);
  //})
  //.get(function() {
    //return this._password;
  //});

//// Public profile information
//UserSchema
  //.virtual('profile')
  //.get(function() {
    //return {
      //'firstName': this.firstName,
      //'lastName': this.lastName,
      //'role': this.role
    //};
  //});

//// Non-sensitive info we'll be putting in the token
//UserSchema
  //.virtual('token')
  //.get(function() {
    //return {
      //'_id': this._id,
      //'role': this.role
    //};
  //});

/**
 * Validations
 */

// Validate empty email
//UserSchema
  //.path('email')
  //.validate(function(email) {
    //return email.length;
  //}, 'Email cannot be blank');

// Validate empty password
//UserSchema
  //.path('hashedPassword')
  //.validate(function(hashedPassword) {
    //return hashedPassword.length;
  //}, 'Password cannot be blank');

// Validate email is not taken
//UserSchema
  //.path('email')
  //.validate(function(value, respond) {
    //var self = this;
    //this.constructor.findOne({email: value}, function(err, user) {
      //if(err) throw err;
      //if(user) {
        //if(self.id === user.id) return respond(true);
        //return respond(false);
      //}
      //respond(true);
    //});
//}, 'The specified email address is already in use.');

/**
 * Methods
 */
//UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  //authenticate: function(plainText) {
    //return this.encryptPassword(plainText) === this.hashedPassword;
  //},

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  //makeSalt: function() {
    //return crypto.randomBytes(16).toString('base64');
  //},

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  //encryptPassword: function(password) {
    //if (!password || !this.salt) return '';
    //var salt = new Buffer(this.salt, 'base64');
    //return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  //}
//};

//module.exports = mongoose.model('User', UserSchema);
function createUserData(email, password, role) {
    let salt = makeSalt();
    let hashedPassword= hashPassword(password, salt);

    return {
        email: email,
        role: role,
        hashedPassword: hashedPassword,
        salt: salt,
    };
}

function authenticate(plainText, hashedPassword, salt) {
    return hashPassword(plainText, salt) === hashedPassword;
}

function makeSalt() {
    return crypto.randomBytes(16).toString('base64');
}

function hashPassword(plainText, salt) {
    if (!plainText || !salt) {
        return '';
    }

    let buffer = new Buffer(salt, 'base64');
    
    return crypto.pbkdf2Sync(plainText, buffer, 10000, 64, 'sha512').toString('base64');
}

module.exports = {
    create: create,
    txCreate: txCreate,
    authenticate: authenticate,
};
