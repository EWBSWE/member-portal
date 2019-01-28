"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../util");
const EventSubscriber_1 = require("./EventSubscriber");
const EventPayment_1 = require("./EventPayment");
const EventProduct_1 = require("./EventProduct");
const EmailTemplate_1 = require("./EmailTemplate");
const EventParticipant_1 = require("./EventParticipant");
const EventModelEntityMapper_1 = require("./EventModelEntityMapper");
class EventRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        const eventEntities = await this.db.any(`
			SELECT *
			FROM event
		`);
        const events = eventEntities.map(EventModelEntityMapper_1.toEvent);
        const participantEntities = await this.db.any(`
			SELECT event_id, member_id, name, email
			FROM event_participant
			JOIN member ON member_id = member.id
		`);
        const participantsByEventId = util_1.groupBy(participantEntities, (p) => p.event_id);
        events.forEach((e) => {
            const maybeParticipants = participantsByEventId.get(e.id) || [];
            e.participants = maybeParticipants.map(EventParticipant_1.EventParticipant.fromEntity);
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
        const event = EventModelEntityMapper_1.toEvent(entity);
        event.addons = addons.map(EventProduct_1.EventProduct.fromEntity);
        event.participants = participants.map(EventParticipant_1.EventParticipant.fromEntity);
        event.subscribers = subscribers.map(EventSubscriber_1.EventSubscriber.fromEntity);
        event.payments = payments.map(EventPayment_1.EventPayment.fromEntity);
        event.emailTemplate = EmailTemplate_1.EmailTemplate.fromEntity(emailTemplate);
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
        return this.get(entity.id);
    }
    async get(id) {
        const maybeEvent = await this.find(id);
        if (!maybeEvent) {
            throw new Error('Event not found');
        }
        return maybeEvent;
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
}
exports.EventRepository = EventRepository;
//# sourceMappingURL=EventRepository.js.map