import {Formattable} from "./Formattable"
import {EventPaymentEntity} from "./EventPaymentEntity"

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
