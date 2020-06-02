import { EventSubscriberEntity } from "./EventSubscriberEntity";

export class EventSubscriber {
  private readonly event_id: number;
  readonly email: string;

  constructor(event_id: number, email: string) {
    this.event_id = event_id;
    this.email = email;
  }

  toEntity(): EventSubscriberEntity {
    return {
      event_id: this.event_id,
      email: this.email,
    };
  }

  static fromEntity(entity: EventSubscriberEntity): EventSubscriber {
    return new EventSubscriber(entity.event_id, entity.email);
  }
}

export class UnsavedEventSubscriber {
  readonly email: string;

  constructor(email: string) {
    this.email = email;
  }
}
