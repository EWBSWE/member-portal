export class Event implements Formattable, PublicFormattable {
	id: number | null
	name: string
	identifier: string
	active: boolean
	dueDate: Date
	notificationOpen: boolean
	createdAt: Date | null
	updatedAt: Date | null

	// TODO(dan) 27/01/19: implement
	participants: number

	constructor(
		id: number,
		name: string,
		identifier: string,
		active: boolean,
		dueDate: Date,
		notificationOpen: boolean,
		createdAt: Date,
		updatedAt: Date
	) {
		this.id = id
		this.name = name
		this.identifier = identifier
		this.active = active
		this.dueDate = dueDate
		this.notificationOpen = notificationOpen
		this.createdAt = createdAt
		this.updatedAt = updatedAt
		this.participants = 0
	}

	formatResponse(): any {
		return {
			id: this.id,
			name: this.name,
			identifier: this.identifier,
			active: this.active,
			// TODO(dan) 27/01/19: The client currently consumes the due_date, until that is fixed we put both here.
			dueDate: this.dueDate,
			due_date: this.dueDate,
			notificationOpen: this.notificationOpen,
			participants: this.participants,
			// TODO(dan) 27/01/19: The client currently consumes the created_at, until that is fixed we put both here.
			createdAt: this.createdAt,
			created_at: this.createdAt
		}
	}

	formatPublicResponse(): any {
		return {
			id: this.id,
			name: this.name,
			identifier: this.identifier,
			active: this.active,
			dueDate: this.dueDate,
			notificationOpen: this.notificationOpen
		}
	}
}

// When objects are used within the authenticated backend walls we can use
// formatResponse to pass sensitive stuff like emails and such. If objects
// are to be shared to everyone, use formatPublicResponse instead.
interface Formattable {
	formatResponse(): any
}

interface PublicFormattable {
	formatPublicResponse(): any
}
