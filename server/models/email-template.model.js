/**
 * Email template model
 *
 * @namespace model.EmailTemplate
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

var postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    sender: 'sender',
    subject: 'subject',
    body: 'body',
};

/**
 * Create email template
 *
 * @memberOf model.EmailTemplate
 * @param {Object} data - Contains email template attributes
 * @returns {Promise<Object|Error>} Resolves to an object.
 */
function create(data) {
    let {columns, wrapped} = postgresHelper.mapDataForInsert(COLUMN_MAP, data);

    if (columns === null || wrapped === null) {
        return Promise.reject('No attributes to create email template');
    }

    let sql = `
        INSERT INTO email_template (${columns})
        VALUES (${wrapped})
        RETURNING id
    `;

    return db.one(sql, data);
}

module.exports = {
    create: create,
};
