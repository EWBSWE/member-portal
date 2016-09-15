'use strict';

let db = require('../db').db;

function create(message, origin, params) {
    let data = {
        message: message,
        origin: origin,
        params: JSON.stringify(params),
    };

    return db.one(`
        INSERT INTO ewb_error (message, text, origin, params)
        VALUES ($[message], $[text], $[origin], $[params])
        RETURNING id
    `, data);
}

function index() {
    return db.any(`
        SELECT id, message, origin, text, params, created_at
        FROM ewb_error
        ORDER BY created_at DESC
    `);
}

function get(id) {
    return db.oneOrNone(`
        SELECT id, message, origin, text, params, created_at
        FROM ewb_error
        WHERE id = $1
    `, id);
}

module.exports = {
    create: create,
    index: index,
    get: get
};
