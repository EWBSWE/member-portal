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
import { SqlProvider } from "../../SqlProvider"
import { PgEmailTemplateEntity } from "./PgEmailTemplateEntity"

export class EventRepository {
	private readonly db: IDatabase<{}, any>
	private readonly sqlProvider: SqlProvider

	constructor(db: any, sqlProvider: SqlProvider) {
		this.db = db
		this.sqlProvider = sqlProvider
	}

	async findAll(): Promise<Event[]> {
		const eventEntities: EventEntity[] = await this.db.any(this.sqlProvider.Events)
		const events: Event[] = eventEntities.map(toEvent)

		const participantEntities: EventParticipantEntity[] = await this.db.any(this.sqlProvider.EventParticipants)

		const participantsByEventId: Map<number, EventParticipantEntity[]> =
			groupBy(participantEntities, (p: EventParticipantEntity) => p.event_id)

		events.forEach((e: Event) => {
			const maybeParticipants = participantsByEventId.get(e.id!) || []
			e.participants = maybeParticipants.map(EventParticipant.fromEntity);
		})

		return events
	}

	async find(id: number): Promise<Event | null> {
		const entity: EventEntity | null = await this.db.oneOrNone(this.sqlProvider.EventById, id)
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
			PgEmailTemplateEntity
			] = await this.db.task(async (t) =>
			Promise.all([
				t.many(this.sqlProvider.EventAddonsById, entity.id),
				t.any(this.sqlProvider.EventParticipantsById, entity.id),
				t.any(this.sqlProvider.EventSubscribersById, entity.id),
				t.any(this.sqlProvider.EventPaymentsById, entity.id),
				t.one<PgEmailTemplateEntity>(this.sqlProvider.EventEmailTemplate, entity.email_template_id)
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
		const entity: EventEntity | null = await this.db.oneOrNone(this.sqlProvider.ActiveEventByIdentifier, identifier)
		if (!entity) {
			return null
		}

		return this.get(entity.id)
	}

	async get(id: number): Promise<Event> {
		const maybeEvent: Event | null = await this.find(id);
		if (!maybeEvent) throw new Error('Event not found')
		return maybeEvent
	}
}
