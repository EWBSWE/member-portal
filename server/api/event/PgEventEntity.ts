import { EventEntity } from "./EventEntity";
import { PgEventParticipantEntity, toEventParticipantEntity } from "./PgEventParticipantEntity";

export type PgEventEntity = {
    id: number;
    name: string;
    description: string;
    identifier: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    due_date: Date;
    email_template_id: number;
    notification_open: boolean;
};

export function toEventEntity(row: PgEventEntity, participants: PgEventParticipantEntity[]): EventEntity {
    return {
        id: row.id,
        name: row.name,
        identifier: row.identifier,
        active: row.active,
        dueDate: row.due_date,
        notificationOpen: row.notification_open,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        emailTemplateId: row.email_template_id,
        participants: participants.map(toEventParticipantEntity)
    }
}
