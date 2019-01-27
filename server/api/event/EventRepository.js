"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = require("./Event");
const util_1 = require("../../util");
class EventRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        const eventEntities = await this.db.any(`
			SELECT *
			FROM event
		`);
        const events = eventEntities.map(this.toModel);
        const participantEntities = await this.db.any(`
			SELECT *
			FROM event_participant
		`);
        const participantsByEventId = util_1.groupBy(participantEntities, (p) => p.event_id);
        events.forEach((e) => {
            const maybeParticipants = participantsByEventId.get(e.id) || [];
            e.participants = maybeParticipants.length;
        });
        return events;
    }
    async find(id) {
        const entity = await this.db.oneOrNone(`SELECT * FROM event WHERE id = $1`, id);
        if (!entity) {
            return null;
        }
        return this.toModel(entity);
    }
    async findByPublicIdentifier(identifier) {
        const entity = await this.db.oneOrNone(`
			SELECT *
			FROM event 
			WHERE 
				active AND
				identifier = $1
		`, identifier);
        if (!entity) {
            return null;
        }
        return this.toModel(entity);
    }
    toModel(entity) {
        return new Event_1.Event(entity.id, entity.name, entity.identifier, entity.active, entity.due_date, entity.notification_open, entity.created_at, entity.updated_at);
    }
}
exports.EventRepository = EventRepository;
//# sourceMappingURL=EventRepository.js.map