'use strict';

function transform(entity) {
  // Entity accessors are underscores (like foo_bar_id). Ideally we want 
  // them to be camelCased so that they fit in with the rest of the project.

  // But it doesn't bring any other benefit so maybe we can do that later.
  return entity;
}

module.exports = {
  transform
};
