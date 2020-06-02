import { PaymentEntity } from "./PaymentEntity";

export class Payment {
  readonly id: number;
  readonly memberId: number;
  readonly currencyCode: string;
  readonly amount: number;
  readonly createdAt: Date;

  constructor(
    id: number,
    memberId: number,
    currencyCode: string,
    amount: number,
    createdAt: Date
  ) {
    this.id = id;
    this.memberId = memberId;
    this.currencyCode = currencyCode;
    this.amount = amount;
    this.createdAt = createdAt;
  }

  static fromEntity(entity: PaymentEntity): Payment {
    return new Payment(
      entity.id,
      entity.member_id,
      entity.currency_code,
      entity.amount,
      entity.created_at
    );
  }
}
