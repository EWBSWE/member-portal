import { EventParticipantEntity, toEventParticipant } from "./EventParticipantEntity";
import { Event } from "./Event";

export type EventEntity = {
    id: number
    name: string
    identifier: string
    active: boolean
    dueDate: Date
    notificationOpen: boolean
    createdAt: Date
    updatedAt: Date
    emailTemplateId: number
    participants: EventParticipantEntity[]
}

export function toEvent(entity: EventEntity): Event {
    const event = new Event(
        entity.id,
        entity.name,
        entity.identifier,
        entity.active,
        entity.dueDate,
        entity.notificationOpen,
        entity.createdAt,
        entity.updatedAt
    )

    event.participants = entity.participants.map(toEventParticipant)

    return event
}
