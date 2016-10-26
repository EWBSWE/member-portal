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

function create(data) {
    let dataValid = false;
    if (Array.isArray(data)) {
        dataValid = data.map(validate).reduce((a, b) => { return a && b; }, true);
    } else if (typeof data === 'object'){
        dataValid = validate(data);
    }

    if (!dataValid) {
        return Promise.reject('Invalid member');
    }

    // Helper function to create member
    let _create = (member, transaction) => {
        if (member.password !== undefined && member.password !== null) {
            let salt = makeSalt();
            let hashedPassword = hashPassword(data.password, salt);

            Object.assign(member, {
                hashedPassword: hashedPassword,
                salt: salt,
                resetValidity: null,
                resetToken: null,
            });

            delete member.password;
        }

        let {columns, wrapped} = postgresHelper.mapDataForInsert(COLUMN_MAP, member);

        if (columns === null || wrapped === null) {
            return null;
        }

        let sql = `
            INSERT INTO member (${columns})
            VALUES (${wrapped})
            RETURNING id, email, expiration_date
        `;

        return transaction.one(sql, member);
    };

    // If data is an array, assume we want to create multiple members.
    // Otherwise we try to create a single member.
    if (Array.isArray(data)) {
        return db.tx(transaction => {
            let queries = data.map(member => {
                return _create(member, transaction);
            });

            if (queries.includes(null)) {
                return Promise.reject(new Error('Some members could not be mapped'));
            }

            return transaction.batch(queries);
        });
    } else {
        return _create(data, db);
    }
}

function validate(member) {
    if (!validEmail(member.email)) {
        return false;
    }

    // Password is optional
    if (member.password && !validPassword(member.password)) {
        return false;
    }
    // Role is optional
    if (member.role && !validRole(member.role)) {
        return false;
    }

    return true;
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
    if (data.password !== undefined && data.password !== null) {
        if (!validPassword(data.password)) {
            return Promise.reject('Invalid password');
        }


        let salt = makeSalt();
        let hashedPassword = hashPassword(data.password, salt);

        Object.assign(data, {
            hashedPassword: hashedPassword,
            salt: salt,
            resetValidity: null,
            resetToken: null,
        });

        delete data.password;
    }

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
            expiration_date,
            reset_token
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

function createResetToken(id) {
    let resetToken = crypto.randomBytes(24).toString('hex');

    return db.one(`
        UPDATE member
        SET
            reset_validity = NOW() + '15 minutes'::interval,
            reset_token = $2
        WHERE id = $1
        RETURNING email, reset_token
    `, [id, resetToken]);
}

function findBy(data) {
    let wheres = postgresHelper.where(COLUMN_MAP, data);

    return db.any(`
        SELECT id, email, reset_validity
        FROM member
        WHERE ${wheres.clause}
    `, wheres.data);
}

module.exports = {
    index: index,
    get: get,
    create: create,
    update: update,
    authenticate: authenticate,
    find: find,
    findBy: findBy,
    destroy: destroy,
    createResetToken: createResetToken,
    validate: validate,
}
