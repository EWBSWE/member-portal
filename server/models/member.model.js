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
    chapterId: 'chapter_id',
    employer: 'employer',
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
            let hashedPassword = hashPassword(member.password, salt);

            Object.assign(member, {
                hashedPassword: hashedPassword,
                salt: salt,
                resetValidity: null,
                resetToken: null,
            });

            delete member.password;
        }

        let {columns, wrapped} = postgresHelper.insert(COLUMN_MAP, member);

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
    return new Promise((resolve, reject) => {
        if (data.newPassword !== undefined && data.newPassword !== null && data.password !== undefined && data.password !== null) {
            db.one('SELECT hashed_password, salt FROM member WHERE id = $1', id).then(member => {
                if (!authenticate(data.password, member.hashed_password, member.salt)) {
                    return Promise.reject('Invalid password');
                }

                return Promise.resolve();
            }).then(() => {
                if (!validPassword(data.newPassword)) {
                    return Promise.reject('Invalid password');
                }

                let salt = makeSalt();
                let hashedPassword = hashPassword(data.newPassword, salt);

                Object.assign(data, {
                    hashedPassword: hashedPassword,
                    salt: salt,
                    resetValidity: null,
                    resetToken: null,
                });

                resolve();
            }).catch(err => {
                reject(err);
            });
        } else if (data.newPassword !== undefined && data.newPassword !== null && data.resetToken !== undefined && data.resetToken !== null) {
            if (!validPassword(data.newPassword)) {
                return Promise.reject('Invalid password');
            }

            let salt = makeSalt();
            let hashedPassword = hashPassword(data.newPassword, salt);

            Object.assign(data, {
                hashedPassword: hashedPassword,
                salt: salt,
                resetValidity: null,
                resetToken: null,
            });

            resolve();
        } else {
            resolve();
        }
    }).then(() => {
        let mapped = postgresHelper.update(COLUMN_MAP, data);

        if (mapped === null) {
            return Promise.reject('No attributes to update');
        }

        return db.one(`
            UPDATE member
            SET ${mapped}
            WHERE id = $[id]
            RETURNING *
        `, Object.assign(data, {id: id}));
    });
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
            member.id,
            email,
            name,
            location,
            education,
            profession,
            member_type,
            gender,
            year_of_birth,
            created_at,
            expiration_date,
            employer
        FROM member
        LEFT JOIN member_type ON (member.member_type_id = member_type.id)
        ORDER BY id
    `);
}

function activeMembers() {
    return db.any(`
        SELECT
            member.id,
            email,
            name,
            location,
            education,
            profession,
            member_type,
            gender,
            year_of_birth,
            created_at,
            expiration_date
        FROM member
        LEFT JOIN member_type ON member.member_type_id = member_type.id
        WHERE
            member_type IS NOT NULL AND
            expiration_date >= NOW()
        ORDER BY id
    `);
}

function get(id) {
    return db.oneOrNone(`
        SELECT
            member.id,
            email,
            name,
            role,
            location,
            education,
            profession,
            member_type,
            member_type_id,
            gender,
            year_of_birth,
            expiration_date,
            reset_token,
            chapter_id,
            employer
        FROM member
        LEFT JOIN member_type ON (member.member_type_id = member_type.id)
        WHERE member.id = $1
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
        SELECT id, email, role, reset_validity, expiration_date
        FROM member
        WHERE ${wheres.clause}
    `, wheres.data);
}

function extendMembership(member, product) {
    if (!member.id) {
        throw 'Missing id';
    }

    let expirationDate = moment().add(product.attribute.days, 'days').toDate();

    if (member.expiration_date !== null) {
        expirationDate = moment(member.expiration_date).add(product.attribute.days, 'days').toDate();
    }

    return update(member.id, {expirationDate: expirationDate});
}

module.exports = {
    index: index,
    activeMembers: activeMembers,
    get: get,
    create: create,
    update: update,
    authenticate: authenticate,
    find: find,
    findBy: findBy,
    destroy: destroy,
    createResetToken: createResetToken,
    validate: validate,
    extendMembership: extendMembership,
}
