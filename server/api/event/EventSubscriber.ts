import {Formattable} from "./Formattable"
import {EventSubscriberEntity} from "./EventSubscriberEntity"

export class EventSubscriber implements Formattable {
	email: string

	constructor(email: string) {
		this.email = email
	}

	formatResponse(): any {
		return { email: this.email }
	}

	static fromEntity(entity: EventSubscriberEntity): EventSubscriber {
		return new EventSubscriber(entity.email)
	}
}
