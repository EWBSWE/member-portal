import { EventPaymentEntity } from "./EventPaymentEntity";

export class EventPayment {
  readonly paymentId: number;
  readonly name: string;
  readonly email: string;
  readonly amount: number;
  readonly addons: number[];
  readonly message: string | null;

  constructor(
    paymentId: number,
    name: string,
    email: string,
    amount: number,
    addons: number[],
    message: string | null
  ) {
    this.paymentId = paymentId;
    this.name = name;
    this.email = email;
    this.amount = amount;
    this.message = message;
    this.addons = addons;
  }

  static fromEntity(entity: EventPaymentEntity): EventPayment {
    return new EventPayment(
      entity.payment_id,
      entity.name,
      entity.email,
      entity.amount,
      entity.addons,
      entity.message
    );
  }
}
