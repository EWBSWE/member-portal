import {
	EmailTemplateEntity,
	EventParticipantEntity,
	EventPaymentEntity,
	EventProductEntity,
	EventSubscriberEntity
} from "./EventRepository"

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

export class EventParticipant implements Formattable {
	name: string
	email: string

	constructor(name: string, email: string) {
		this.name = name
		this.email = email
	}

	formatResponse(): any {
		return { email: this.email }
	}

	static fromEntity(entity: EventParticipantEntity): EventParticipant {
		return new EventParticipant(entity.name, entity.email)
	}
}

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

export class EventProduct implements Formattable {
	id: number
	productId: number
	name: string
	price: number
	capacity: number
	description: string

	constructor(
		id: number,
		productId: number,
		name: string,
		price: number,
		capacity: number,
		description: string
	) {
		this.id = id
		this.productId = productId
		this.name = name
		this.price = price
		this.capacity = capacity
		this.description = description
	}

	formatResponse(): any {
		return {
			id: this.id,
			// TODO(dan) 27/01/19: client consumes underscore key
			productId: this.productId,
			product_id: this.productId,
			name: this.name,
			price: this.price,
			capacity: this.capacity,
			description: this.description
		}
	}

	static fromEntity(entity: EventProductEntity): EventProduct {
		return new EventProduct(
			entity.id,
			entity.product_id,
			entity.name,
			entity.price,
			entity.capacity,
			entity.description
		)
	}
}

export class EmailTemplate {
	subject: string
	body: string

	constructor(subject: string, body: string) {
		this.subject = subject
		this.body = body
	}

	static fromEntity(entity: EmailTemplateEntity): EmailTemplate {
		return new EmailTemplate(entity.subject, entity.body)
	}
}

export class EventPayment implements Formattable {
	paymentId: number
	name: string
	email: string
	amount: number
	// TODO(dan) 27/01/19: consider using type Partial<EventProduct>, or change to addonIds
	addons: number[]
	message: string | null

	constructor(
		paymentId: number,
		name: string,
		email: string,
		amount: number,
		addons: number[],
		message: string | null
	) {
		this.paymentId = paymentId
		this.name = name
		this.email = email
		this.amount = amount
		this.message = message
		this.addons = addons
	}

	formatResponse(): any {
		return {
			name: this.name,
			email: this.email,
			amount: this.amount,
			addons: this.addons,
			message: this.message
		}
	}

	static fromEntity(entity: EventPaymentEntity): EventPayment {
		return new EventPayment(
			entity.payment_id,
			entity.name,
			entity.email,
			entity.amount,
			entity.addons,
			entity.message
		)
	}
}
