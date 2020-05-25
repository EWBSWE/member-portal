import { IDatabase } from "pg-promise";
import { EmailTemplateEntity } from "../api/event/EmailTemplateEntity";
import { EventEntity } from "../api/event/EventEntity";
import { EventSubscriberEntity } from "../api/event/EventSubscriberEntity";
import {
  PgEmailTemplateEntity,
  toEmailTemplateEntity,
} from "../api/event/PgEmailTemplateEntity";
import { PgEventEntity, toEventEntity } from "../api/event/PgEventEntity";
import {
  PgEventParticipantEntity,
  toEventParticipantEntity,
} from "../api/event/PgEventParticipantEntity";
import {
  PgEventPaymentEntity,
  toEventPaymentEntity,
} from "../api/event/PgEventPaymentEntity";
import {
  PgEventProductEntity,
  toEventProductEntity,
} from "../api/event/PgEventProductEntity";
import {
  PgEventSubscriberEntity,
  toEventSubscriberEntity,
} from "../api/event/PgEventSubscriberEntity";
import { SqlProvider } from "../SqlProvider";
import { EventDetails } from "./EventDetails";
import { EventStore } from "./EventStore";

export class PgEventStore implements EventStore {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;

  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.db = db;
    this.sqlProvider = sqlProvider;
  }

  async findAll(): Promise<EventEntity[]> {
    const events = await this.db.any<PgEventEntity>(this.sqlProvider.Events);
    return events.map(toEventEntity);
  }

  async findById(id: number): Promise<EventEntity | null> {
    const event = await this.db.oneOrNone<PgEventEntity>(
      this.sqlProvider.EventById,
      id
    );
    if (event == null) return null;
    return toEventEntity(event);
  }

  async findBySlug(slug: string): Promise<EventEntity | null> {
    const event = await this.db.oneOrNone<PgEventEntity>(
      this.sqlProvider.ActiveEventByIdentifier,
      slug
    );
    if (event == null) return null;
    return toEventEntity(event);
  }

  async getDetails(event: EventEntity): Promise<EventDetails> {
    const [
      participants,
      addons,
      subscribers,
      payments,
      emailTemplate,
    ] = await this.db.task(async (t) =>
      Promise.all([
        t.any<PgEventParticipantEntity>(
          this.sqlProvider.EventParticipantsById,
          event.id
        ),
        t.many<PgEventProductEntity>(
          this.sqlProvider.EventAddonsById,
          event.id
        ),
        t.any<PgEventSubscriberEntity>(
          this.sqlProvider.EventSubscribersById,
          event.id
        ),
        t.any<PgEventPaymentEntity>(
          this.sqlProvider.EventPaymentsById,
          event.id
        ),
        t.one<PgEmailTemplateEntity>(
          this.sqlProvider.EventEmailTemplate,
          event.emailTemplateId
        ),
      ])
    );

    return {
      participants: participants.map(toEventParticipantEntity),
      addons: addons.map(toEventProductEntity),
      subscribers: subscribers.map(toEventSubscriberEntity),
      payments: payments.map(toEventPaymentEntity),
      emailTemplate: toEmailTemplateEntity(emailTemplate),
    };
  }

  async updateEvent(
    event: EventEntity,
    subscribers: EventSubscriberEntity[],
    emailTemplate: EmailTemplateEntity
  ): Promise<void> {
    await this.db.tx(async (t) => {
      const params = [
        event.id,
        event.name,
        event.description,
        event.identifier,
        event.active,
        event.dueDate,
        event.notificationOpen,
      ];
      await t.one(this.sqlProvider.EventUpdate, params);

      await t.tx(async (t) => {
        await t.any(this.sqlProvider.EventClearSubscribers, event.id);
        await Promise.all(
          subscribers.map((subscriber) =>
            t.any(this.sqlProvider.EventAddSubscriber, [
              event.id,
              subscriber.email,
            ])
          )
        );
      });

      await t.any(this.sqlProvider.EventUpdateEmailTemplate, [
        event.emailTemplateId,
        emailTemplate.subject,
        emailTemplate.body,
      ]);
    });
  }
}
