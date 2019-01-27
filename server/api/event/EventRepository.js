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
			SELECT event_id, member_id, name, email
			FROM event_participant
			JOIN member ON member_id = member.id
		`);
        const participantsByEventId = util_1.groupBy(participantEntities, (p) => p.event_id);
        events.forEach((e) => {
            const maybeParticipants = participantsByEventId.get(e.id) || [];
            e.participants = maybeParticipants.map(Event_1.EventParticipant.fromEntity);
        });
        return events;
    }
    async find(id) {
        const entity = await this.db.oneOrNone(`
			SELECT *
			FROM event
			WHERE id = $1
		`, id);
        if (!entity) {
            return null;
        }
        const [addons, participants, subscribers, payments, emailTemplate] = await this.db.task(async (t) => Promise.all([
            this.getAddonsBatched(entity.id, t),
            this.getParticipantsBatched(entity.id, t),
            this.getSubscribersBatched(entity.id, t),
            this.getPaymentsBatched(entity.id, t),
            this.getEmailTemplateBatched(entity.email_template_id, t)
        ]));
        const event = this.toModel(entity);
        event.addons = addons.map(Event_1.EventProduct.fromEntity);
        event.participants = participants.map(Event_1.EventParticipant.fromEntity);
        event.subscribers = subscribers.map(Event_1.EventSubscriber.fromEntity);
        event.payments = payments.map(Event_1.EventPayment.fromEntity);
        console.log(payments);
        event.emailTemplate = Event_1.EmailTemplate.fromEntity(emailTemplate);
        return event;
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
    async getAddonsBatched(eventId, db) {
        return db.many(`
			SELECT
			  event_product.id,
			  product_id,
			  product.name,
			  product.price,
			  capacity,
			  product.description
			FROM event_product
			JOIN product ON product.id = event_product.product_id
			WHERE event_id = $1
			ORDER BY product.id
		`, eventId);
    }
    async getParticipantsBatched(eventId, db) {
        return db.any(`
			SELECT name, email
			FROM event_participant
			JOIN member ON member.id = member_id
			WHERE event_id = $1
		`, eventId);
    }
    async getSubscribersBatched(eventId, db) {
        return db.any(`
			SELECT email
			FROM event_subscriber
			WHERE event_id = $1
		`, eventId);
    }
    async getPaymentsBatched(eventId, db) {
        return db.any(`
			SELECT
				event_payment.payment_id,
				name,
				email,
				amount,
				message,
				array_agg(payment_product.product_id) AS addons
			FROM event_payment
			JOIN payment ON event_payment.payment_id = payment.id
			JOIN member ON payment.member_id = member.id
			JOIN payment_product ON payment.id = payment_product.payment_id
			WHERE event_id = $1
			GROUP BY 
				event_payment.payment_id,
				name,
				email,
				amount,
				message
		`, eventId);
    }
    async getEmailTemplateBatched(emailTemplateId, db) {
        return db.one(`
			SELECT subject, body
			FROM email_template
			WHERE id = $1
		`, emailTemplateId);
    }
    toModel(entity) {
        return new Event_1.Event(entity.id, entity.name, entity.identifier, entity.active, entity.due_date, entity.notification_open, entity.created_at, entity.updated_at);
    }
}
exports.EventRepository = EventRepository;
//# sourceMappingURL=EventRepository.js.map