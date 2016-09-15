'use strict';

var crypto = require('crypto');

var db = require('../db').db;

function create(email, password, role) {
    let salt = makeSalt();
    let hashedPassword= hashPassword(password, salt);

    let data = {
        email: email,
        role: role,
        hashedPassword: hashedPassword,
        salt: salt,
    };

    return db.one(`
        INSERT INTO member(email, hashed_password, salt, role)
        VALUES($[email], $[hashedPassword], $[salt], $[role])
        RETURNING id
    `, data);
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

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
//UserSchema
  //.pre('save', function(next) {
    //if (!this.isNew) return next();

    //if (!validatePresenceOf(this.hashedPassword))
      //next(new Error('Invalid password'));
    //else
      //next();
  //});

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
    console.log(plainText, hashedPassword, salt);
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
    authenticate: authenticate,
    makeSalt: makeSalt,
    hashPassword: hashPassword,
    create: create
};
