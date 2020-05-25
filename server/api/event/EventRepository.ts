import { Event } from "./Event"
import { EventSubscriber } from "./EventSubscriber"
import { EventPayment } from "./EventPayment"
import { EventProduct } from "./EventProduct"
import { EmailTemplate } from "./EmailTemplate"
import { EventStore } from "../../event/EventStore"
import { toEvent } from "./EventEntity"

export class EventRepository {
    private readonly eventStore: EventStore

    constructor(eventStore: EventStore) {
        this.eventStore = eventStore
    }

    async findAll(): Promise<Event[]> {
        const events = await this.eventStore.findAll()
        return events.map(toEvent)
    }

    async find(id: number): Promise<Event | null> {
        const entity = await this.eventStore.findById(id)
        if (entity == null) return null
        const details = await this.eventStore.getDetails(entity)

        const event = toEvent(entity)

        event.addons = details.addons.map(EventProduct.fromEntity)
        event.subscribers = details.subscribers.map(EventSubscriber.fromEntity)
        event.payments = details.payments.map(EventPayment.fromEntity)
        event.emailTemplate = EmailTemplate.fromEntity(details.emailTemplate)

        return event
    }

    async findByPublicIdentifier(identifier: string): Promise<Event | null> {
        const entity = await this.eventStore.findBySlug(identifier)
        if (!entity) return null
        return this.find(entity.id)
    }
}
