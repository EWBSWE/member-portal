// TODO(dan) 27/01/19: Future me, I'm sorry, what even is this type?
export type EventPaymentEntity = PaymentEntity & {
	event_id: number
	payment_id: number
	message: string | null
	// TODO(dan) 27/01/19: name + email is for complex event query
	name: string
	email: string
}

type PaymentEntity = {
	id: number
	member_id: number
	amount: number
	currency_code: string
	created_at: Date
	addons: number[]
}
