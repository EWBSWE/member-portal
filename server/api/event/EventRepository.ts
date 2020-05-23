import { IDatabase } from "pg-promise"
import { Event } from "./Event"
import { PgEventSubscriberEntity, toEventSubscriberEntity } from "./PgEventSubscriberEntity"
import { PgEventProductEntity, toEventProductEntity } from "./PgEventProductEntity"
import { PgEventPaymentEntity, toEventPaymentEntity } from "./PgEventPaymentEntity"
import { EventSubscriber } from "./EventSubscriber"
import { EventPayment } from "./EventPayment"
import { EventProduct } from "./EventProduct"
import { EmailTemplate } from "./EmailTemplate"
import { SqlProvider } from "../../SqlProvider"
import { PgEmailTemplateEntity } from "./PgEmailTemplateEntity"
import { EventStore } from "../../event/EventStore"
import { toEvent } from "./EventEntity"

export class EventRepository {
    private readonly db: IDatabase<{}, any>
    private readonly sqlProvider: SqlProvider
    private readonly eventStore: EventStore

    constructor(db: any, sqlProvider: SqlProvider, eventStore: EventStore) {
        this.db = db
        this.sqlProvider = sqlProvider
        this.eventStore = eventStore
    }

    async findAll(): Promise<Event[]> {
        const events = await this.eventStore.findAll()
        return events.map(toEvent)
    }

    async find(id: number): Promise<Event | null> {
        const entity = await this.eventStore.findById(id)
        if (entity == null) return null

        const [addons, subscribers, payments, emailTemplate] = await this.db.task(async (t) =>
            Promise.all([
                t.many<PgEventProductEntity>(this.sqlProvider.EventAddonsById, entity.id),
                t.any<PgEventSubscriberEntity>(this.sqlProvider.EventSubscribersById, entity.id),
                t.any<PgEventPaymentEntity>(this.sqlProvider.EventPaymentsById, entity.id),
                t.one<PgEmailTemplateEntity>(this.sqlProvider.EventEmailTemplate, entity.emailTemplateId)
            ])
        )

        const event = toEvent(entity)

        event.addons = addons.map(toEventProductEntity).map(EventProduct.fromEntity)
        event.subscribers = subscribers.map(toEventSubscriberEntity).map(EventSubscriber.fromEntity)
        event.payments = payments.map(toEventPaymentEntity).map(EventPayment.fromEntity)
        event.emailTemplate = EmailTemplate.fromEntity(emailTemplate)

        return event
    }

    async findByPublicIdentifier(identifier: string): Promise<Event | null> {
        const entity = await this.eventStore.findBySlug(identifier)
        if (!entity) return null
        return this.find(entity.id)
    }
}
