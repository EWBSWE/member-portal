import { EmailTemplate, UnsavedEmailTemplate } from "./EmailTemplate";
import { EventPayment } from "./EventPayment";
import { EventSubscriber, UnsavedEventSubscriber } from "./EventSubscriber";
import { EventProduct, UnsavedEventProduct } from "./EventProduct";
import { EventParticipant } from "./EventParticipant";
import { EventEntity } from "./EventEntity";
import { EventParticipantEntity } from "./EventParticipantEntity";
import { EventProductEntity } from "./EventProductEntity";
import { EventSubscriberEntity } from "./EventSubscriberEntity";
import { EventPaymentEntity } from "./EventPaymentEntity";
import { EmailTemplateEntity } from "./EmailTemplateEntity";

export class Event {
  readonly id: number | null;
  name: string;
  description: string;
  identifier: string;
  active: boolean;
  dueDate: Date;
  notificationOpen: boolean;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
  participants: EventParticipant[];
  addons: EventProduct[];
  subscribers: EventSubscriber[];
  payments: EventPayment[];
  emailTemplate: EmailTemplate;

  constructor(
    id: number | null,
    name: string,
    description: string,
    identifier: string,
    active: boolean,
    dueDate: Date,
    notificationOpen: boolean,
    createdAt: Date | null,
    updatedAt: Date | null,
    participants: EventParticipant[],
    addons: EventProduct[],
    subscribers: EventSubscriber[],
    payments: EventPayment[],
    emailTemplate: EmailTemplate
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.identifier = identifier;
    this.active = active;
    this.dueDate = dueDate;
    this.notificationOpen = notificationOpen;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.participants = participants;
    this.addons = addons;
    this.subscribers = subscribers;
    this.payments = payments;
    this.emailTemplate = emailTemplate;
  }

  static fromEvent(event: Event): EventEntity {
    const id = check(event.id);
    return {
      id: id,
      name: event.name,
      description: event.description,
      identifier: event.identifier,
      active: event.active,
      due_date: event.dueDate,
      notification_open: event.notificationOpen,
      email_template_id: event.emailTemplate.id,
      created_at: event.createdAt!,
      updated_at: event.updatedAt!,
    };
  }

  static toEvent(
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
      entity.due_date,
      entity.notification_open,
      entity.created_at,
      entity.updated_at,
      participants.map(EventParticipant.fromEntity),
      addons.map(EventProduct.fromEntity),
      subscribers.map(EventSubscriber.fromEntity),
      payments.map(EventPayment.fromEntity),
      EmailTemplate.fromEntity(emailTemplate)
    );

    return event;
  }
}

export function check<T>(maybe?: T | null): T {
  if (maybe == null) throw new Error("Expected item to be not null");
  if (maybe == undefined) throw new Error("Expected item to be defined");
  return maybe;
}

export class UnsavedEvent {
  readonly name: string;
  readonly description: string;
  readonly identifier: string;
  readonly active: boolean;
  readonly dueDate: Date;
  readonly notificationOpen: boolean;
  readonly addons: UnsavedEventProduct[];
  readonly subscribers: UnsavedEventSubscriber[];
  readonly emailTemplate: UnsavedEmailTemplate;

  constructor(
    name: string,
    description: string,
    identifier: string,
    active: boolean,
    dueDate: Date,
    notificationOpen: boolean,
    addons: UnsavedEventProduct[],
    subscribers: UnsavedEventSubscriber[],
    emailTemplate: UnsavedEmailTemplate
  ) {
    this.name = name;
    this.description = description;
    this.identifier = identifier;
    this.active = active;
    this.dueDate = dueDate;
    this.notificationOpen = notificationOpen;
    this.addons = addons;
    this.subscribers = subscribers;
    this.emailTemplate = emailTemplate;
  }
}
