import { EventStore } from "./EventStore"
import { IDatabase } from "pg-promise"
import { SqlProvider } from "../SqlProvider"
import { EventEntity } from "../api/event/EventEntity"
import { PgEventEntity, toEventEntity } from "../api/event/PgEventEntity"
import { PgEventParticipantEntity } from "../api/event/PgEventParticipantEntity"
import { groupBy } from "../util"
import { PgEventProductEntity, toEventProductEntity } from "../api/event/PgEventProductEntity"
import { PgEventSubscriberEntity, toEventSubscriberEntity } from "../api/event/PgEventSubscriberEntity"
import { PgEventPaymentEntity, toEventPaymentEntity } from "../api/event/PgEventPaymentEntity"
import { PgEmailTemplateEntity, toEmailTemplateEntity } from "../api/event/PgEmailTemplateEntity"
import { EventDetails } from "./EventDetails"

export class PgEventStore implements EventStore {
    private readonly db: IDatabase<{}, any>
    private readonly sqlProvider: SqlProvider

    constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
        this.db = db
        this.sqlProvider = sqlProvider
    }

    async findAll(): Promise<EventEntity[]> {
        const events = await this.db.any<PgEventEntity>(this.sqlProvider.Events)
        const participants = await this.db.any<PgEventParticipantEntity>(this.sqlProvider.EventParticipants)
        const participantsByEventId = groupBy(participants, (p: PgEventParticipantEntity) => p.event_id)

        const result: EventEntity[] = []
        events.forEach(event => {
            const participants = participantsByEventId.get(event.id) || []
            result.push(toEventEntity(event, participants))
        })

        return result
    }

    async findById(id: number): Promise<EventEntity | null> {
        const event = await this.db.oneOrNone<PgEventEntity>(this.sqlProvider.EventById, id)
        if (event == null) return null
        const participants = await this.db.any<PgEventParticipantEntity>(this.sqlProvider.EventParticipantsById, id)
        return toEventEntity(event, participants)
    }

    async findBySlug(slug: string): Promise<EventEntity | null> {
        const event = await this.db.oneOrNone<PgEventEntity>(this.sqlProvider.ActiveEventByIdentifier, slug)
        if (event == null) return null
        const participants = await this.db.any<PgEventParticipantEntity>(this.sqlProvider.EventParticipantsById, event.id)
        return toEventEntity(event, participants)
    }

    async getDetails(event: EventEntity): Promise<EventDetails> {
        const [addons, subscribers, payments, emailTemplate] = await this.db.task(async (t) =>
            Promise.all([
                t.many<PgEventProductEntity>(this.sqlProvider.EventAddonsById, event.id),
                t.any<PgEventSubscriberEntity>(this.sqlProvider.EventSubscribersById, event.id),
                t.any<PgEventPaymentEntity>(this.sqlProvider.EventPaymentsById, event.id),
                t.one<PgEmailTemplateEntity>(this.sqlProvider.EventEmailTemplate, event.emailTemplateId)
            ])
        )

        return {
            addons: addons.map(toEventProductEntity),
            subscribers: subscribers.map(toEventSubscriberEntity),
            payments: payments.map(toEventPaymentEntity),
            emailTemplate: toEmailTemplateEntity(emailTemplate)
        }
    }
}

