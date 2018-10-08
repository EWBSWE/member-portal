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

    return this._toModel(entity);
  }

  async create(member) {
    const entity = await db.one(`
	INSERT INTO member (
	    email,
	    name,
	    location,
	    education,
	    profession,
	    member_type_id,
	    gender,
	    year_of_birth,
	    expiration_date
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
	    $[expirationDate]
	)
        RETURNING *
    `, member);

    return this._toModel(entity);
  }

  async update(member) {
    const entity = await db.one(`
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
	    expiration_date = $[expirationDate]
	WHERE id = $[id]
    `, member);

    return this._toModel(entity);
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
    );
  }
}

module.exports = new MemberRepository();
