/**
 * Outgoing message model
 *
 * @namespace model.OutgoingMessage
 * @memberOf model
 */

'use strict';

var db = require('../db').db;
var postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    recipient: 'recipient',
    sender: 'sender',
    subject: 'subject',
    body: 'body',
    failedAttempts: 'failed_attempts',
    sendAt: 'send_at',
    priority: 'priority',
};

/**
 * Create an outgoing message
 *
 * @memberOf model.OutgoingMessage
 * @param {Object} data - Object containing outgoing message attributes.
 * @returns {Promise<Object|Error>} Resolves to an object
 */
function create(data) {
    let {columns, wrapped} = postgresHelper.insert(COLUMN_MAP, data);

    return db.one(`
        INSERT INTO outgoing_message (${columns})
        VALUES (${wrapped})
        RETURNING id
    `, data);
}

/**
 * Fetch n outgoing messages ordered by priority
 *
 * @memberOf model.OutgoingMessage
 * @param {Number} n - An integer
 * @returns {Promise<Array|Error>} Resolves to an array of messages
 */
function fetch(n) {
    return db.any(`
        SELECT id, recipient, sender, subject, body, failed_attempts
        FROM outgoing_message
        WHERE NOW() > send_at
        ORDER BY priority DESC
        LIMIT $1
    `, n);
}

/**
 * Remove outgoing message
 *
 * @memberOf model.OutgoingMessage
 * @param {Number} id - An integer
 * @returns {Promise<Null|Error>} Resolves to null
 */
function remove(id) {
    return db.none(`
        DELETE FROM outgoing_message
        WHERE id = $1
    `, id);
}

/**
 * Increment fail counter
 *
 * @memberOf model.OutgoingMessage
 * @param {Number} id - An integer
 * @returns {Promise<Object|Error>} Resolves to an object
 */
function fail(id) {
    return db.one(`
        UPDATE outgoing_message
        SET failed_attempts = failed_attempts + 1
        WHERE id = $1
        RETURNING id, recipient, sender, subject, body, failed_attempts
    `, id);
}

/**
 * Find by recipient
 *
 * @memberOf model.OutgoingMessage
 * @param {String} recipient - An email address
 * @returns {Promise<Array|Error>} Resolves to an array of messages
 */
function find(recipient) {
    return db.any(`
        SELECT id, recipient, sender, subject, body, failed_attempts
        FROM outgoing_message
        WHERE recipient = $1
    `, recipient);
}

module.exports = {
  create,
  fetch,
  remove,
  fail,
  find
};
