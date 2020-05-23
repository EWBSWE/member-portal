export type EventPaymentEntity = {
	paymentId: number
	name: string
	email: string
	amount: number
	message: string | null
	addons: number[]
}

