import { EmailTemplate } from "./EmailTemplate";
import { EventPayment } from "./EventPayment";
import { EventSubscriber } from "./EventSubscriber";
import { EventProduct } from "./EventProduct";
import { EventParticipant } from "./EventParticipant";

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
}
