import { EventParticipant } from "./EventParticipant"

export type EventParticipantEntity = {
    name: string
    email: string
    eventId: number
    memberId: number
}

export function toEventParticipant(entity: EventParticipantEntity): EventParticipant {
    return new EventParticipant(entity.name, entity.email)
}
