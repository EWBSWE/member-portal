import {Formattable} from "./Formattable"
import {EventProductEntity} from "./EventProductEntity"

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
