import { EventSubscriberEntity } from "./EventSubscriberEntity";

export type PgEventSubscriberEntity = {
    email: string;
};

export function toEventSubscriberEntity(row: PgEventSubscriberEntity): EventSubscriberEntity {
    return { email: row.email };
}
