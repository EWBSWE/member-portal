import { EventPayment } from "./EventPayment";

export type EventPaymentEntity = {
  paymentId: number;
  name: string;
  email: string;
  amount: number;
  message: string | null;
  addons: number[];
};

export function toEventPaymentEntity(
  payment: EventPayment
): EventPaymentEntity {
  return {
    paymentId: payment.paymentId,
    name: payment.name,
    email: payment.email,
    amount: payment.amount,
    message: payment.message,
    addons: payment.addons,
  };
}
