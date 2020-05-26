import { EventSubscriberEntity } from "./EventSubscriberEntity";

export type PgEventSubscriberEntity = {
  event_id: number;
  email: string;
};

export function toEventSubscriberEntity(
  row: PgEventSubscriberEntity
): EventSubscriberEntity {
  return { email: row.email };
}
