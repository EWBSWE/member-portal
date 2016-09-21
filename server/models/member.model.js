'use strict';

var Promise = require('bluebird');
var crypto = require('crypto');
var moment = require('moment');
var lodash = require('lodash');

var config = require('../config/environment');
var db = require('../db').db;

function create(memberAttributes) {
    return txCreate(memberAttributes, db);
}

function txCreate(memberAttributes, transaction) {
    if (!valid(memberAttributes)) {
        return Promise.reject(generateErrorMessages(memberAttributes));
    }

    return transaction.one(`
        INSERT INTO member (
            email,
            location,
            education,
            profession,
            member_type_id,
            gender,
            year_of_birth,
            expiration_date
        ) VALUES (
            $[email],
            $[location],
            $[education],
            $[profession],
            $[memberTypeId],
            $[gender],
            $[yearOfBirth],
            $[expirationDate]
        )
        RETURNING id, email
    `, memberAttributes);
}

function createAuthenticatable(email, password, role) {
    return txCreateAuthenticatable(email, password, role, db);
}

function txCreateAuthenticatable(email, password, role, transaction) {
    if (!validEmail(email)) {
        return Promise.reject('Invalid email');
    }
    if (!validPassword(password)) {
        return Promise.reject('Password too short');
    }
    if(!validRole(role)) {
        return Promise.reject('Invalid role');
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

function update(id, attributes) {
    return db.one(`
        SELECT
            email,
            location,
            education,
            profession,
            member_type_id,
            gender,
            year_of_birth,
            expiration_date
        FROM member
        WHERE id = $1
    `, id).then(data => {
        delete attributes.id;
        let updatedData = Object.assign(data, attributes);

        return db.one(`
            UPDATE member
            SET
                location = $[location],
                education = $[education],
                profession = $[profession],
                member_type_id = $[member_type_id],
                gender = $[gender],
                year_of_birth = $[year_of_birth],
                expiration_date = $[expiration_date],
            WHERE id = $[id]
        `, updatedData);
    });
}

function index() {
    return db.any(`
        SELECT
            email,
            location,
            education,
            profession,
            member_type_id,
            gender,
            year_of_birth,
            expiration_date
        FROM member
        ORDER BY id
    `);
}

function get(id) {
    return db.oneOrNone(`
        SELECT
            id,
            email,
            location,
            education,
            profession,
            member_type_id,
            gender,
            year_of_birth,
            expiration_date
        FROM member
        WHERE id = $1
    `, id);
}

function find(email) {
    return db.oneOrNone(`
        SELECT
            id,
            email,
            location,
            education,
            profession,
            member_type_id,
            gender,
            year_of_birth,
            expiration_date
        FROM member
        WHERE email = $1
    `, email);
}

function destroy(id) {
    return db.none(`DELETE FROM member WHERE id = $1`, id);
}

function valid(member) {
    if (!member.email || !validEmail(member.email)) {
        return false;
    }

    return true;
}

function generateErrorMessages(member) {
    let errors = {};

    if (!member.email) {
        errors.email = 'Epost saknas';
    } else if (!validEmail(member.email)) {
        errors.email = 'Ogiltig epost-adress';
    }

    return errors;
}

function validEmail(email) {
    if (!email) {
        return false;
    }

    var re = /.+@.+/i;

    return re.test(email);
}

function validRole(role) {
    return role && config.userRoles.indexOf(role) > -1;
}

function validPassword(password) {
    return password && password.length >= 8;
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
    createAuthenticatable: createAuthenticatable,
    txCreateAuthenticatable: txCreateAuthenticatable,
    authenticate: authenticate,
    update: update,
    index: index,
    get: get,
    find: find,
    destroy: destroy,
}

//// Non-sensitive info we'll be putting in the token
//UserSchema
  //.virtual('token')
  //.get(function() {
    //return {
      //'_id': this._id,
      //'role': this.role
    //};
  //});
