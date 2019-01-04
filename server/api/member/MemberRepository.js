'use strict';

const db = require('../../db').db;

const { Member } = require('./Member');

class MemberRepository {
  async firstWithEmail(email) {
    const entity = await db.oneOrNone(`
	SELECT *
	FROM member
	WHERE email = $1
    `, [email]);

    if (!entity) {
      return null;
    }

    return this._toModel(entity);
  }

  async create(member) {
    const entity = await this._transactionCreate(db, member);
    return this._toModel(entity);
  }

  async update(member) {
    const entity = await this._transactionUpdate(db, member);
    return this._toModel(entity);
  }

  async findByEmails(emails) {
    const entities = await db.any(`
	SELECT *
	FROM member
	WHERE email IN ($1:csv)
    `, [emails]);

    return entities.map(this._toModel);
  }

  async createMany(members) {
    const entities = await db.tx(tx =>
	Promise.all(
	  members.map(
	    member => this._transactionCreate(tx, member)
	  )
	)
    );

    return entities.map(this._toModel);
  }

  async updateMany(members) {
    const entities = await db.tx(tx =>
	Promise.all(
	  members.map(
	    member => this._transactionUpdate(tx, member)
	  )
	)
    );

    return entities.map(this._toModel);
  }

  async _transactionCreate(transaction, member) {
    return transaction.one(`
	INSERT INTO member (
	    email,
	    name,
	    location,
	    education,
	    profession,
	    member_type_id,
	    gender,
	    year_of_birth,
	    expiration_date,
	    chapter_id
	)
	VALUES (
	    $[email],
	    $[name],
	    $[location],
	    $[education],
	    $[profession],
	    $[memberTypeId],
	    $[gender],
	    $[yearOfBirth],
	    $[expirationDate],
	    $[chapterId]
	)
        RETURNING *
    `, member);
  }

  async _transactionUpdate(transaction, member) {
    return transaction.one(`
	UPDATE member 
	SET 
	    email = $[email],
	    name = $[name],
	    location = $[location],
	    education = $[education],
	    profession = $[profession],
	    member_type_id = $[memberTypeId],
	    gender = $[gender],
	    year_of_birth = $[yearOfBirth],
	    expiration_date = $[expirationDate],
	    chapter_id = $[chapterId]
	WHERE id = $[id]
	RETURNING *
    `, member);
  }

  _toModel(entity) {
    return new Member(
      entity.id,
      entity.email,
      entity.name,
      entity.location,
      entity.education,
      entity.profession,
      entity.member_type_id,
      entity.gender,
      entity.year_of_birth,
      entity.expiration_date,
      entity.chapter_id,
    );
  }
}

module.exports = new MemberRepository();
