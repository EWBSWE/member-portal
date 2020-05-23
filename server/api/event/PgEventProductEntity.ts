import { EventProductEntity } from "./EventProductEntity";

export type PgEventProductEntity = {
    id: number;
    product_id: number;
    name: string;
    price: number;
    capacity: number;
    description: string;
};

export function toEventProductEntity(row: PgEventProductEntity): EventProductEntity {
    return {
        id: row.id,
        productId: row.product_id,
        name: row.name,
        price: row.price,
        capacity: row.capacity,
        description: row.description
    };
}
