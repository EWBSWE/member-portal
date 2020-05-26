import { EventProductEntity } from "./EventProductEntity";

export class EventProduct {
  readonly id: number;
  readonly productId: number;
  readonly name: string;
  readonly price: number;
  readonly capacity: number;
  readonly description: string;

  constructor(
    id: number,
    productId: number,
    name: string,
    price: number,
    capacity: number,
    description: string
  ) {
    this.id = id;
    this.productId = productId;
    this.name = name;
    this.price = price;
    this.capacity = capacity;
    this.description = description;
  }

  static fromEntity(entity: EventProductEntity): EventProduct {
    return new EventProduct(
      entity.id,
      entity.product_id,
      entity.name,
      entity.price,
      entity.capacity,
      entity.description
    );
  }
}
