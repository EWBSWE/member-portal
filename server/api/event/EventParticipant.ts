import {Formattable} from "./Formattable"
import {EventParticipantEntity} from "./EventParticipantEntity"

export class EventParticipant implements Formattable {
	name: string
	email: string

	constructor(name: string, email: string) {
		this.name = name
		this.email = email
	}

	formatResponse(): any {
		return {email: this.email}
	}

	static fromEntity(entity: EventParticipantEntity): EventParticipant {
		return new EventParticipant(entity.name, entity.email)
	}
}

