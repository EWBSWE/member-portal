import { IDatabase } from "pg-promise"
import { Event } from "./Event"
import { groupBy } from "../../util"
import { PgEventEntity, toEventEntity } from "./PgEventEntity"
import { PgEventSubscriberEntity, toEventSubscriberEntity } from "./PgEventSubscriberEntity"
import { PgEventProductEntity, toEventProductEntity } from "./PgEventProductEntity"
import { EventParticipantEntity } from "./EventParticipantEntity"
import { PgEventParticipantEntity, toEventParticipantEntity } from "./PgEventParticipantEntity"
import { PgEventPaymentEntity, toEventPaymentEntity } from "./PgEventPaymentEntity"
import { EventSubscriber } from "./EventSubscriber"
import { EventPayment } from "./EventPayment"
import { EventProduct } from "./EventProduct"
import { EmailTemplate } from "./EmailTemplate"
import { EventParticipant } from "./EventParticipant"
// TODO(dan) 28/01/19: Unsure if this is the way to go with mapping stuff back and forth
import { toEvent } from "./EventModelEntityMapper"
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
        const eventEntities = await this.db.any<PgEventEntity>(this.sqlProvider.Events)
        const events = eventEntities.map(toEventEntity).map(toEvent)

        const participantRows = await this.db.any<PgEventParticipantEntity>(this.sqlProvider.EventParticipants)
        const participantEntities = participantRows.map(toEventParticipantEntity)
        const participantsByEventId = groupBy(participantEntities, (p: EventParticipantEntity) => p.eventId)

        events.forEach(e => {
            const maybeParticipants = participantsByEventId.get(e.id!) || []
            e.participants = maybeParticipants.map(EventParticipant.fromEntity);
        })

        return events
    }

    async find(id: number): Promise<Event | null> {
        const maybeRow = await this.db.oneOrNone<PgEventEntity>(this.sqlProvider.EventById, id)
        if (!maybeRow) return null
        const entity = toEventEntity(maybeRow)

        const [addons, participants, subscribers, payments, emailTemplate] = await this.db.task(async (t) =>
            Promise.all([
                t.many<PgEventProductEntity>(this.sqlProvider.EventAddonsById, entity.id),
                t.any<PgEventParticipantEntity>(this.sqlProvider.EventParticipantsById, entity.id),
                t.any<PgEventSubscriberEntity>(this.sqlProvider.EventSubscribersById, entity.id),
                t.any<PgEventPaymentEntity>(this.sqlProvider.EventPaymentsById, entity.id),
                t.one<PgEmailTemplateEntity>(this.sqlProvider.EventEmailTemplate, entity.emailTemplateId)
            ])
        )

        const event = toEvent(entity)
        event.addons = addons.map(toEventProductEntity).map(EventProduct.fromEntity)
        event.participants = participants.map(toEventParticipantEntity).map(EventParticipant.fromEntity)
        event.subscribers = subscribers.map(toEventSubscriberEntity).map(EventSubscriber.fromEntity)
        event.payments = payments.map(toEventPaymentEntity).map(EventPayment.fromEntity)
        event.emailTemplate = EmailTemplate.fromEntity(emailTemplate)

        return event
    }

    async findByPublicIdentifier(identifier: string): Promise<Event | null> {
        const entity = await this.db.oneOrNone<PgEventEntity>(this.sqlProvider.ActiveEventByIdentifier, identifier)
        if (!entity) return null
        return this.get(entity.id)
    }

    async get(id: number): Promise<Event> {
        const maybeEvent = await this.find(id);
        if (!maybeEvent) throw new Error('Event not found')
        return maybeEvent
    }
}
