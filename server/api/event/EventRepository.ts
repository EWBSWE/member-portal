import { Event } from "./Event";
import { EventStore } from "../../event/EventStore";
import { toEvent, fromEvent } from "./EventEntity";
import { fromEmailTemplate } from "./EmailTemplateEntity";
import { toEventSubscriberEntity } from "./EventSubscriberEntity";

export class EventRepository {
  private readonly eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  async findAll(): Promise<Event[]> {
    const events = await this.eventStore.findAll();

    return Promise.all(
      events.map(async (event) => {
        const details = await this.eventStore.getDetails(event);
        return toEvent(
          event,
          details.participants,
          details.addons,
          details.subscribers,
          details.payments,
          details.emailTemplate
        );
      })
    );
  }

  async find(id: number): Promise<Event | null> {
    const entity = await this.eventStore.findById(id);
    if (entity == null) return null;
    const details = await this.eventStore.getDetails(entity);

    return toEvent(
      entity,
      details.participants,
      details.addons,
      details.subscribers,
      details.payments,
      details.emailTemplate
    );
  }

  async findByPublicIdentifier(identifier: string): Promise<Event | null> {
    const entity = await this.eventStore.findBySlug(identifier);
    if (!entity) return null;
    return this.find(entity.id);
  }

  async update(event: Event): Promise<void> {
    await this.eventStore.updateEvent(
      fromEvent(event),
      event.subscribers!.map(toEventSubscriberEntity),
      fromEmailTemplate(event.emailTemplate!)
    );
  }
}
