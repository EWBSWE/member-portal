import { EmailTemplateEntity } from "../api/event/EmailTemplateEntity";
import { EventEntity } from "../api/event/EventEntity";
import { EventSubscriberEntity } from "../api/event/EventSubscriberEntity";
import { EventDetails } from "./EventDetails";

export interface EventStore {
  findAll(): Promise<EventEntity[]>;
  findById(id: number): Promise<EventEntity | null>;
  findBySlug(slug: string): Promise<EventEntity | null>;
  getDetails(entity: EventEntity): Promise<EventDetails>;
  updateEvent(
    entity: EventEntity,
    subscribers: EventSubscriberEntity[],
    emailTemplate: EmailTemplateEntity
  ): Promise<void>;
}
