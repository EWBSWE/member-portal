import {IDatabase} from "pg-promise"
import {Event} from "./Event"
import {groupBy} from "../../util"
import {EventEntity} from "./EventEntity"
import {EventSubscriberEntity} from "./EventSubscriberEntity"
import {EventProductEntity} from "./EventProductEntity"
import {EventParticipantEntity} from "./EventParticipantEntity"
import {EmailTemplateEntity} from "./EmailTemplateEntity"
import {EventPaymentEntity} from "./EventPaymentEntity"
import {EventSubscriber} from "./EventSubscriber"
import {EventPayment} from "./EventPayment"
import {EventProduct} from "./EventProduct"
import {EmailTemplate} from "./EmailTemplate"
import {EventParticipant} from "./EventParticipant"
// TODO(dan) 28/01/19: Unsure if this is the way to go with mapping stuff back and forth
import {toEvent} from "./EventModelEntityMapper"

export class EventRepository {
	private db: IDatabase<any>

	constructor(db: any) {
		this.db = db
	}

	async findAll(): Promise<Event[]> {
		const eventEntities: EventEntity[] = await this.db.any(`
			SELECT *
			FROM event
		`)
		const events: Event[] = eventEntities.map(toEvent)

		const participantEntities: EventParticipantEntity[] = await this.db.any(`
			SELECT event_id, member_id, name, email
			FROM event_participant
			JOIN member ON member_id = member.id
		`)

		const participantsByEventId: Map<number, EventParticipantEntity[]> =
			groupBy(participantEntities, (p: EventParticipantEntity) => p.event_id)

		events.forEach((e: Event) => {
			const maybeParticipants = participantsByEventId.get(e.id!) || []
			e.participants = maybeParticipants.map(EventParticipant.fromEntity);
		})

		return events
	}

	async find(id: number): Promise<Event | null> {
		const entity: EventEntity | null = await this.db.oneOrNone(`
			SELECT *
			FROM event
			WHERE id = $1
		`, id)
		if (!entity) {
			return null
		}

		const [
			addons,
			participants,
			subscribers,
			payments,
			emailTemplate
		]: [
			EventProductEntity[],
			EventParticipantEntity[],
			EventSubscriberEntity[],
			EventPaymentEntity[],
			EmailTemplateEntity
			] = await this.db.task(async (t) =>
			Promise.all([
				this.getAddonsBatched(entity.id, t),
				this.getParticipantsBatched(entity.id, t),
				this.getSubscribersBatched(entity.id, t),
				this.getPaymentsBatched(entity.id, t),
				this.getEmailTemplateBatched(entity.email_template_id, t)
			])
		)

		const event = toEvent(entity)
		event.addons = addons.map(EventProduct.fromEntity)
		event.participants = participants.map(EventParticipant.fromEntity)
		event.subscribers = subscribers.map(EventSubscriber.fromEntity)
		event.payments = payments.map(EventPayment.fromEntity)
		event.emailTemplate = EmailTemplate.fromEntity(emailTemplate)

		return event
	}

	async findByPublicIdentifier(identifier: string): Promise<Event | null> {
		const entity: EventEntity | null = await this.db.oneOrNone(`
			SELECT *
			FROM event 
			WHERE 
				active AND
				identifier = $1
		`, identifier)
		if (!entity) {
			return null
		}

		return this.get(entity.id)
	}

	async get(id: number): Promise<Event> {
		const maybeEvent: Event | null = await this.find(id);
		if (!maybeEvent) {
			throw new Error('Event not found')
		}
		return maybeEvent
	}

	private async getAddonsBatched(eventId: number, db: IDatabase<any>): Promise<EventProductEntity[]> {
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
		`, eventId)
	}

	private async getParticipantsBatched(eventId: number, db: IDatabase<any>): Promise<EventParticipantEntity[]> {
		return db.any(`
			SELECT name, email
			FROM event_participant
			JOIN member ON member.id = member_id
			WHERE event_id = $1
		`, eventId)
	}

	private async getSubscribersBatched(eventId: number, db: IDatabase<any>): Promise<EventSubscriberEntity[]> {
		return db.any(`
			SELECT email
			FROM event_subscriber
			WHERE event_id = $1
		`, eventId)
	}

	private async getPaymentsBatched(eventId: number, db: IDatabase<any>): Promise<EventPaymentEntity[]> {
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
		`, eventId)
	}

	private async getEmailTemplateBatched(emailTemplateId: number, db: IDatabase<any>): Promise<EventSubscriberEntity[]> {
		return db.one(`
			SELECT subject, body
			FROM email_template
			WHERE id = $1
		`, emailTemplateId)
	}

}
