/**
 * Member model
 *
 * @namespace model.Member
 * @memberOf model
 */

'use strict';

var Promise = require('bluebird');
var crypto = require('crypto');
var moment = require('moment');

var config = require('../config/environment');

var db = require('../db').db;
var postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    email: 'email',
    hashedPassword: 'hashed_password',
    salt: 'salt',
    role: 'role',
    resetValidity: 'reset_validity',
    resetToken: 'reset_token',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    name: 'name',
    location: 'location',
    education: 'education',
    profession: 'profession',
    memberTypeId: 'member_type_id',
    gender: 'gender',
    yearOfBirth: 'year_of_birth',
    expirationDate: 'expiration_date',
};

function create(memberAttributes) {
    return txCreate(memberAttributes, db);
}

function txCreate(data, transaction) {
    if (!valid(data)) {
        return Promise.reject(generateErrorMessages(data));
    }
    
    let {columns, wrapped} = postgresHelper.mapDataForInsert(COLUMN_MAP, data);
    
    if (columns === null || wrapped === null) {
        return Promise.reject('Missing attributes');
    }

    return transaction.one(`
        INSERT INTO member (${columns}) VALUES (${wrapped})
        RETURNING id, email, expiration_date
    `, data);
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

/**
 * Updates a member
 * 
 * @memberOf model.Member
 * @param {number} id - The member id
 * @param {object} data - The attributes that should be updated
 * @returns {Promise<object,Error>} Resolves to the updated member
 */
function update(id, data) {
    let mapped = postgresHelper.mapDataForUpdate(COLUMN_MAP, data);

    if (mapped  === null) {
        return Promise.reject('No attributes to update');
    }

    return db.one(`
        UPDATE member
        SET ${mapped}
        WHERE id = $[id]
        RETURNING *
    `, Object.assign(data, {id: id}));
}

/**
 * Returns all members.
 *
 * @memberOf model.Member
 * @returns {Promise}
 */
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
            role,
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
            name,
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
