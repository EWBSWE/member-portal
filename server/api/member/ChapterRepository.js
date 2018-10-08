'use strict';

const db = require('../../db').db;

const { Chapter } = require('./Chapter');

class ChapterRepository {
  async findAll() {
    const entities = await db.any(`
	SELECT * FROM chapter
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
