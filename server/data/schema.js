'use strict';

function assertQuery(schema, params) {
  // Extract keys from params
  const keys = Object.keys(params);

  if (keys.length === 0) {
    throw new Error('Missing query parameters');
  }

  // If some key is not defined in the schema we want to throw an error
  const anyNotInSchema = keys.some(key => !(key in schema));
  if (anyNotInSchema) {
    throw new Error(`Schema mismatch! Got ${keys} but entity has ${schema}`);
  }

  return true;
}

function createQuery(schema, params) {
  Schema.assertQuery(schema, params);

  const keys = Object.keys(params);
  // Create where clause "attribute = $1"
  // TODO if you want to project an array we need to change the syntax
  const toMatch = keys.map((key, index) => `${schema[key]} = $${index + 1}`)
    .join(' AND ');
  const against = Object.values(params);

  return { toMatch, against };
}

module.exports = {
  createQuery,
};
