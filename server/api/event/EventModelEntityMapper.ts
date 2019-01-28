import {EventEntity} from "./EventEntity"
import {Event} from "./Event"
import {NotImplementedError} from "../../NotImplementedError"

export function toEvent(entity: EventEntity): Event {
	return new Event(
		entity.id,
		entity.name,
		entity.identifier,
		entity.active,
		entity.due_date,
		entity.notification_open,
		entity.created_at,
		entity.updated_at
	)
}

export function toEventEntity(event: Event): EventEntity {
	throw new NotImplementedError()
}

