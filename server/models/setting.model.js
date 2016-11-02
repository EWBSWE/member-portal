/**
 * Settings model
 *
 * @namespace model.Setting
 * @memberOf model
 */

'use strict';

let db = require('../db').db;

var postgresHelper = require('../helpers/postgres.helper');

/**
 * Find settings by attributes
 *
 * @param {Object} data - Object to query against
 * @returns {Promise<Array|Error>} Resolves to array of objects
 */
function findBy(data) {
    let wheres = postgresHelper.where(COLUMN_MAP, data);

    return db.any(`
        SELECT key, value, description
        FROM setting
        WHERE ${wheres.clause}
    `, wheres.data);
}

module.exports = {
    findBy: findBy,
};
