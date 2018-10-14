'use strict';

const db = require('../../db').db;

const { Chapter } = require('./Chapter');

class ChapterRepository {
  async get(id) {
    if (!Number.isInteger(id)) {
      // Invalid argument, return null
      return null;
    }

    const entity = await db.oneOrNone(`
	SELECT *
	FROM chapter
	WHERE id = $1
    `, [id]);

    if (!entity) {
      return null;
    }

    return this._toModel(entity);
  }

  async findAll() {
    const entities = await db.any(`
	SELECT *
	FROM chapter
	ORDER BY name ASC
    `);

    return entities.map(this._toModel);
  }

  _toModel(entity) {
    return new Chapter(
      entity.id,
      entity.name,
      entity.member_type_id
    );
  }
}

module.exports = new ChapterRepository();
