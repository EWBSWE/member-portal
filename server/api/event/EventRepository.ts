import {IDatabase} from "pg-promise"
import {EmailTemplate, Event, EventParticipant, EventPayment, EventProduct, EventSubscriber} from "./Event"
import {groupBy} from "../../util"

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
		const events: Event[] = eventEntities.map(this.toModel)

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

		const event = this.toModel(entity)
		event.addons = addons.map(EventProduct.fromEntity)
		event.participants = participants.map(EventParticipant.fromEntity)
		event.subscribers = subscribers.map(EventSubscriber.fromEntity)
		event.payments = payments.map(EventPayment.fromEntity)
		console.log(payments)
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
		return this.toModel(entity)
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

	private toModel(entity: EventEntity): Event {
		return new Event(
			entity.id,
			entity.name,
			entity.identifier,
			entity.active,
			entity.due_date,
			entity.notification_open,
			entity.created_at,
			entity.updated_at
		)
	}
}

// TODO(dan) 27/01/19: The types listed below are not an exact match to their Database entry. This is sad. But also a
// step in the right direction!
export type EventEntity = {
	id: number
	name: string
	identifier: string
	active: boolean
	due_date: Date
	notification_open: boolean
	created_at: Date
	updated_at: Date
	email_template_id: number
}

export type EventParticipantEntity = MemberEntity & {
	event_id: number
	member_id: number
}

// TODO(dan) 27/01/19: this is incomplete
type MemberEntity = {
	name: string
	email: string
}

// TODO(dan) 27/01/19: Future me, I'm sorry, what even is this type?
export type EventPaymentEntity = PaymentEntity & {
	event_id: number
	payment_id: number
	message: string | null
	// TODO(dan) 27/01/19: name + email is for complex event query
	name: string
	email: string
}

type PaymentEntity = {
	id: number
	member_id: number
	amount: number
	currency_code: string
	created_at: Date
	addons: number[]
}

export type EventProductEntity = ProductEntity & {
	id: number
	event_id: number
	capacity: number
	product_id: number
}

export type ProductEntity = {
	name: string
	price: number
	description: string
}

export type EventSubscriberEntity = {
	email: string
}

export type EmailTemplateEntity = {
	subject: string
	body: string
}
