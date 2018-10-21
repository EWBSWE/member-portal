'use strict';

const db = require('../../db').db;

const { OutgoingMessage } = require('./OutgoingMessage');

class OutgoingMessageRepository {
  async fetch(limit) {
    const entities = await db.any(`
	SELECT *
	FROM outgoing_message
	WHERE NOW() > send_at
	ORDER BY priority DESC
	LIMIT $1
    `, limit);

    return entities.map(this._toModel);
  }

  async remove(id) {
    return db.none(`
	DELETE FROM outgoing_message
	WHERE id = $1
    `, id);
  }

  async create(outgoingMessage) {
    const entity = await db.one(`
	INSERT INTO outgoing_message (
	    recipient,
	    sender,
	    subject,
	    body,
	    failed_attempts,
	    send_at,
	    priority
	)
	VALUES (
	    $[recipient],
	    $[sender],
	    $[subject],
	    $[body],
	    $[failedAttempts],
	    $[sendAt],
	    $[priority]
	)
        RETURNING *
    `, outgoingMessage);

    return this._toModel(entity);
  }

  _toModel(entity) {
    return new OutgoingMessage(
      entity.id,
      entity.recipient,
      entity.sender,
      entity.subject,
      entity.body,
      entity.failed_attempts,
      entity.send_at,
      entity.priority
    );
  }
}

module.exports = new OutgoingMessageRepository();
