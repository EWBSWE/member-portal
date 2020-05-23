import { EventEntity } from "./EventEntity"
import { Event } from "./Event"

export function toEvent(entity: EventEntity): Event {
    return new Event(
        entity.id,
        entity.name,
        entity.identifier,
        entity.active,
        entity.dueDate,
        entity.notificationOpen,
        entity.createdAt,
        entity.updatedAt
    )
}
