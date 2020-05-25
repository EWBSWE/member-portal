import { Event } from "./Event";
import {
  EventParticipantEntity,
  toEventParticipant,
} from "./EventParticipantEntity";
import { EventProductEntity, toEventProductEntity } from "./EventProductEntity";
import {
  EventSubscriberEntity,
  toEventSubscriberEntity,
} from "./EventSubscriberEntity";
import { EventPaymentEntity, toEventPaymentEntity } from "./EventPaymentEntity";
import {
  EmailTemplateEntity,
  toEmailTemplateEntity,
} from "./EmailTemplateEntity";

export type EventEntity = {
  id: number;
  name: string;
  description: string;
  identifier: string;
  active: boolean;
  dueDate: Date;
  notificationOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
  emailTemplateId: number;
};

export function toEvent(
  entity: EventEntity,
  participants: EventParticipantEntity[],
  addons: EventProductEntity[],
  subscribers: EventSubscriberEntity[],
  payments: EventPaymentEntity[],
  emailTemplate: EmailTemplateEntity
): Event {
  const event = new Event(
    entity.id,
    entity.name,
    entity.description,
    entity.identifier,
    entity.active,
    entity.dueDate,
    entity.notificationOpen,
    entity.createdAt,
    entity.updatedAt,
    participants.map(toEventParticipant),
    addons.map(toEventProductEntity),
    subscribers.map(toEventSubscriberEntity),
    payments.map(toEventPaymentEntity),
    toEmailTemplateEntity(emailTemplate)
  );

  return event;
}

export function fromEvent(event: Event): EventEntity {
  return {
    id: event.id!,
    name: event.name,
    description: event.description,
    identifier: event.identifier,
    active: event.active,
    dueDate: event.dueDate,
    notificationOpen: event.notificationOpen,
    emailTemplateId: event.emailTemplate.id,
    createdAt: event.createdAt!,
    updatedAt: event.updatedAt!,
  };
}
