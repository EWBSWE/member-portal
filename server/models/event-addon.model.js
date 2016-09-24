'use strict';

var db = require('../db').db;

function create(attributes) {
    return db.one(`
        INSERT INTO event (
            event_id,
            capacity,
            product_id
        ) VALUES (
            $[eventId],
            $[capacity],
            $[productId]
        ) RETURNING id, capacity
    `, attributes);
}

module.exports = {
    create: create,
};
