import { Event } from "./Event";
import { SqlProvider } from "../SqlProvider";
import { IDatabase } from "pg-promise";
import { EventEntity } from "./EventEntity";
import { EmailTemplateEntity } from "./EmailTemplateEntity";
import { EventParticipantEntity } from "./EventParticipantEntity";
import { EventProductEntity } from "./EventProductEntity";
import { EventSubscriberEntity } from "./EventSubscriberEntity";
import { EventPaymentEntity } from "./EventPaymentEntity";
import { groupBy, mapBy } from "../util";

export class EventRepository {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;

  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.db = db;
    this.sqlProvider = sqlProvider;
  }

  async findAll(): Promise<Event[]> {
    const [
      events,
      participants,
      addons,
      subscribers,
      payments,
      emails,
    ] = await this.db.tx(async (t) =>
      Promise.all([
        t.any<EventEntity>(this.sqlProvider.Events),
        t.any<EventParticipantEntity>(this.sqlProvider.EventParticipants),
        t.any<EventProductEntity>(this.sqlProvider.EventAddons),
        t.any<EventSubscriberEntity>(this.sqlProvider.EventSubscribers),
        t.any<EventPaymentEntity>(this.sqlProvider.EventPayments),
        t.any<EmailTemplateEntity>(this.sqlProvider.EventEmailTemplate),
      ])
    );

    const participantsByEventId = groupBy(participants, (p) => p.event_id);
    const addonsByEventId = groupBy(addons, (a) => a.event_id);
    const subscribersByEventId = groupBy(subscribers, (s) => s.event_id);
    const paymentsByEventId = groupBy(payments, (p) => p.event_id);
    const emailsById = mapBy(emails, (e) => e.id);

    return events.map((event) => {
      return Event.toEvent(
        event,
        participantsByEventId.get(event.id) || [],
        addonsByEventId.get(event.id) || [],
        subscribersByEventId.get(event.id) || [],
        paymentsByEventId.get(event.id) || [],
        emailsById.get(event.email_template_id)!
      );
    });
  }

  async find(id: number): Promise<Event | null> {
    const event = await this.db.oneOrNone<EventEntity>(
      this.sqlProvider.EventById,
      id
    );
    if (event == null) return null;

    const [
      participants,
      addons,
      subscribers,
      payments,
      emailTemplate,
    ] = await this.db.task(async (t) =>
      Promise.all([
        t.any<EventParticipantEntity>(
          this.sqlProvider.EventParticipantsById,
          event.id
        ),
        t.many<EventProductEntity>(this.sqlProvider.EventAddonsById, event.id),
        t.any<EventSubscriberEntity>(
          this.sqlProvider.EventSubscribersById,
          event.id
        ),
        t.any<EventPaymentEntity>(this.sqlProvider.EventPaymentsById, event.id),
        t.one<EmailTemplateEntity>(
          this.sqlProvider.EventEmailTemplateById,
          event.email_template_id
        ),
      ])
    );

    return Event.toEvent(
      event,
      participants,
      addons,
      subscribers,
      payments,
      emailTemplate
    );
  }

  async findByPublicIdentifier(identifier: string): Promise<Event | null> {
    const event = await this.db.oneOrNone<EventEntity>(
      this.sqlProvider.ActiveEventByIdentifier,
      identifier
    );
    if (event == null) return null;
    return this.find(event.id);
  }

  async update(event: Event): Promise<void> {
    const eventEntity = Event.fromEvent(event);
    const subscriberEntities = event.subscribers.map((s) => s.toEntity());
    const emailTemplateEntity = event.emailTemplate.toEntity();

    await this.db.tx(async (t) => {
      const params = [
        eventEntity.id,
        eventEntity.name,
        eventEntity.description,
        eventEntity.identifier,
        eventEntity.active,
        eventEntity.due_date,
        eventEntity.notification_open,
      ];
      await t.one(this.sqlProvider.EventUpdate, params);

      await t.tx(async (t) => {
        await t.any(this.sqlProvider.EventClearSubscribers, event.id);
        await Promise.all(
          subscriberEntities.map((subscriber) =>
            t.any(this.sqlProvider.EventAddSubscriber, [
              event.id,
              subscriber.email,
            ])
          )
        );
      });

      await t.any(this.sqlProvider.EventUpdateEmailTemplate, [
        emailTemplateEntity.id,
        emailTemplateEntity.subject,
        emailTemplateEntity.body,
      ]);
    });
  }
}
