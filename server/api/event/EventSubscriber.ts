import { EventSubscriberEntity } from "./EventSubscriberEntity"

export class EventSubscriber {
	readonly email: string

	constructor(email: string) {
		this.email = email
	}

	static fromEntity(entity: EventSubscriberEntity): EventSubscriber {
		return new EventSubscriber(entity.email)
	}
}
