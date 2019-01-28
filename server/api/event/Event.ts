import {EmailTemplate} from "./EmailTemplate"
import {EventPayment} from "./EventPayment"
import {EventSubscriber} from "./EventSubscriber"
import {Formattable, PublicFormattable} from "./Formattable"
import {EventProduct} from "./EventProduct"
import {EventParticipant} from "./EventParticipant"

export class Event implements Formattable, PublicFormattable {
	id: number | null
	name: string
	identifier: string
	active: boolean
	dueDate: Date
	notificationOpen: boolean
	createdAt: Date | null
	updatedAt: Date | null

	participants?: EventParticipant[]
	addons?: EventProduct[]
	subscribers?: EventSubscriber[]
	payments?: EventPayment[]
	emailTemplate?: EmailTemplate

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
	}

	formatResponse(): any {
		const response: { [index: string]: any } = {
			id: this.id,
			name: this.name,
			identifier: this.identifier,
			active: this.active,
			// TODO(dan) 27/01/19: The client currently consumes the due_date, until that is fixed we put both here.
			dueDate: this.dueDate,
			due_date: this.dueDate,
			notificationOpen: this.notificationOpen,
			// TODO(dan) 27/01/19: The client currently consumes the created_at, until that is fixed we put both here.
			createdAt: this.createdAt,
			created_at: this.createdAt,
		}

		if (this.subscribers) {
			response.subscribers = this.subscribers.map((s) => s.formatResponse())
		}
		if (this.participants) {
			response.participants = this.participants.map((p) => p.formatResponse())
		}
		if (this.payments) {
			response.payments = this.payments.map((p) => p.formatResponse())
		}
		if (this.addons) {
			response.addons = this.addons.map((p) => p.formatResponse())
		}

		return response
	}

	formatPublicResponse(): any {
		const response: { [index: string]: any } = {
			id: this.id,
			name: this.name,
			identifier: this.identifier,
			active: this.active,
			// TODO(dan) 27/01/19: The client currently consumes the due_date, until that is fixed we put both here.
			dueDate: this.dueDate,
			due_date: this.dueDate,
			// TODO(dan) 27/01/19: The client currently consumes the notification_open, until that is fixed we put both here.
			notificationOpen: this.notificationOpen,
			notification_open: this.notificationOpen,
			// TODO(dan) 27/01/19: The client currently consumes the created_at, until that is fixed we put both here.
			createdAt: this.createdAt,
			created_at: this.createdAt,
		}

		if (this.addons) {
			response.addons = this.addons.map((p) => p.formatResponse())
		}

		return response
	}
}

