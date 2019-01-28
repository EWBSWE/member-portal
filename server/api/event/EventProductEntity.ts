export type EventProductEntity = ProductEntity & {
	id: number
	event_id: number
	capacity: number
	product_id: number
}

export type ProductEntity = {
	name: string
	price: number
	description: string
}
