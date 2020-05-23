import { EventParticipantEntity } from "./EventParticipantEntity";

export type PgEventParticipantEntity = {
    name: string;
    email: string;
    event_id: number;
    member_id: number;
};

export function toEventParticipantEntity(row: PgEventParticipantEntity): EventParticipantEntity {
    return {
        name: row.name,
        email: row.email,
        eventId: row.event_id,
        memberId: row.member_id
    }
}
