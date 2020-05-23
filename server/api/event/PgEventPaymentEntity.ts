import { EventPaymentEntity } from "./EventPaymentEntity";

export type PgEventPaymentEntity = {
    payment_id: number;
    name: string;
    email: string;
    amount: number;
    message: string | null;
    addons: number[];
};

export function toEventPaymentEntity(row: PgEventPaymentEntity): EventPaymentEntity {
    return {
        paymentId: row.payment_id,
        name: row.name,
        email: row.email,
        amount: row.amount,
        message: row.message,
        addons: row.addons
    };
}
