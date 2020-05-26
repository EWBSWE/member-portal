import { PgEventParticipantEntity } from "./PgEventParticipantEntity";

export class EventParticipant {
  readonly name: string;
  readonly email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

  static fromEntity(entity: PgEventParticipantEntity): EventParticipant {
    return new EventParticipant(entity.name, entity.email);
  }
}
