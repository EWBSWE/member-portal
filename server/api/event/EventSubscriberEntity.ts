import { EventSubscriber } from "./EventSubscriber";

export type EventSubscriberEntity = {
  email: string;
};

export function toEventSubscriberEntity(
  subscriber: EventSubscriber
): EventSubscriberEntity {
  return { email: subscriber.email };
}
