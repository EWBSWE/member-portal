import {IDatabase} from "pg-promise"
import {Event} from "./Event"
import {groupBy} from "../../util"

export class EventRepository {
	private db: IDatabase<any>

	constructor(db: any) {
		this.db = db
	}

	async findAll(): Promise<Event[]> {
		const eventEntities: EventEntity[] = await this.db.any(`
			SELECT *
			FROM event
		`)
		const events: Event[] = eventEntities.map(this.toModel)

		const participantEntities: EventParticipantEntity[] = await this.db.any(`
			SELECT *
			FROM event_participant
		`)

		const participantsByEventId: Map<number, EventParticipantEntity[]> =
			groupBy(participantEntities, (p: EventParticipantEntity) => p.event_id)

		events.forEach((e: Event) => {
			const maybeParticipants = participantsByEventId.get(e.id!) || []
			e.participants = maybeParticipants.length;
		})

		return events
	}

	async find(id: number): Promise<Event | null> {
		const entity: EventEntity | null = await this.db.oneOrNone(`SELECT * FROM event WHERE id = $1`, id)
		if (!entity) {
			return null
		}
		return this.toModel(entity)
	}

	async findByPublicIdentifier(identifier: string): Promise<Event | null> {
		const entity: EventEntity | null = await this.db.oneOrNone(`
			SELECT *
			FROM event 
			WHERE 
				active AND
				identifier = $1
		`, identifier)
		if (!entity) {
			return null
		}
		return this.toModel(entity)
	}

	private toModel(entity: EventEntity): Event {
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
}

type EventEntity = {
	id: number,
	name: string,
	identifier: string,
	active: boolean,
	due_date: Date,
	notification_open: boolean,
	created_at: Date,
	updated_at: Date
}

type EventParticipantEntity = {
	event_id: number,
	member_id: number
}

