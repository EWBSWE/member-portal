import { EventProduct } from "./EventProduct";

export type EventProductEntity = {
  id: number;
  name: string;
  price: number;
  description: string;
  capacity: number;
  productId: number;
};

export function toEventProductEntity(
  product: EventProduct
): EventProductEntity {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description,
    capacity: product.capacity,
    productId: product.productId,
  };
}
