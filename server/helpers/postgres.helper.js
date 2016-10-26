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
 * let sql = mapDataToUpdate(columnMap, data);
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
function mapDataForUpdate(columnMap, data) {
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
function mapDataForInsert(columnMap, data) {
    let keys = Object.keys(columnMap);
    let validParams = Object.keys(data).filter(a => { return keys.includes(a); });

    if (validParams.length === 0) {
        return {columns: null, wrapped: null};
    }

    let columns = validParams.map(param => { return columnMap[param] }).join(', ');
    let wrapped = validParams.map(param => { return `$[${param}]`; }).join(', ');

    return {columns, wrapped};
}

module.exports = {
    mapDataForUpdate: mapDataForUpdate,
    mapDataForInsert: mapDataForInsert,
    mapDataForSelect: mapDataForUpdate,
}
