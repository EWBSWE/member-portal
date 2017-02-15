/**
 * PostgreSQL Helper
 *
 * @namespace helper.postgresql
 * @memberOf helper
 */

'use strict';

/**
 * Maps data to a model's columns to be used in an update statement.
 *
 * @example
 * let columnMap = {
 *   key: 'key',
 *   someKey: 'some_key',
 * };
 *
 * let data = {
 *   key: 'some value',
 *   someKey: 'some other value',
 *   illegalKey: 'another value',
 * }
 *
 * let sql = update(columnMap, data);
 *
 * sql => "
 *   key = $[key],
 *   some_key = $[someKey]
 * "
 * 
 * @memberOf helper.postgresql
 * @param {object} columnMap - An object with String keys and String values
 * where a key maps to it's corresponding database column. Helps to not having
 * to code around camelCased Javascript notation and Postgresql underscores.
 * @param {object} data - An object with the data to be mapped. This function
 * only uses the keys to determine which attributes are allowed to be mapped
 * (which is determined by the columnMap)
 * @returns {String|null} Returns a string of the mapped placeholder data or null if
 * no valid valid params could be mapped
 */
function update(columnMap, data) {
    let keys = Object.keys(columnMap);
    let validParams = Object.keys(data).filter(a => { return keys.includes(a); });

    if (validParams.length === 0) {
        return null;
    }

    let mapped = validParams.map(param => {
        return `${columnMap[param]} = $[${param}]`;
    }).join(', ');

    return mapped;
}

/**
 * Maps data to a model's columns to be used in an insert statement.
 *
 * @memberOf helper.postgresql
 * @param {object} columnMap - An object with String keys and String values
 * where a key maps to it's corresponding database column. Helps to not having
 * to code around camelCased Javascript notation and Postgresql underscores.
 * @param {object} data - An object with the data to be mapped. This function
 * only uses the keys to determine which attributes are allowed to be mapped
 * (which is determined by the columnMap)
 * @returns {object|null} Returns an object with the mapped placeholder data or
 * null if no valid valid params could be mapped
 */
function insert(columnMap, data) {
    if (data === undefined) {
        return {columns: null, wrapped: null};
    }

    let keys = Object.keys(columnMap);
    let validParams = Object.keys(data).filter(a => { return keys.includes(a); });

    if (validParams.length === 0) {
        return {columns: null, wrapped: null};
    }

    let columns = validParams.map(param => { return columnMap[param] }).join(', ');
    let wrapped = validParams.map(param => { return `$[${param}]`; }).join(', ');

    return {columns, wrapped};
}

function where(columnMap, data) {
    let keys = Object.keys(columnMap);
    let validParams = Object.keys(data).filter(k => { return keys.includes(k); });

    if (validParams.length === 0) {
        return null;
    }

    let counter = 1;
    let mapped = validParams.map(param => {
        if (Array.isArray(data[param])) {
            return `${columnMap[param]} IN ($${counter++}:csv)`
        }

        return `${columnMap[param]} = $${counter++}`;
    });

    return {
        clause: mapped.join(' AND '),
        data: validParams.map(p => { return data[p]; }),
    }
}

module.exports = {
    where: where,
    insert: insert,
    update: update,

    // deprecated
    mapDataForUpdate: update,
    mapDataForInsert: insert,
}
