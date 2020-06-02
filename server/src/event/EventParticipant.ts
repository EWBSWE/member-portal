import { EventParticipantEntity } from "./EventParticipantEntity";

export class EventParticipant {
  readonly name: string;
  readonly email: string;
  readonly comment?: string;

  constructor(name: string, email: string, comment?: string) {
    this.name = name;
    this.email = email;
    this.comment = comment;
  }

  static fromEntity(entity: EventParticipantEntity): EventParticipant {
    return new EventParticipant(entity.name, entity.email, entity.comment);
  }
}
