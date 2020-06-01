import { Payment } from "./Payment";

const LegacyPayment = require("../models/payment.model");

export class PaymentRepository {
  async find(id: number): Promise<Payment | null> {
    try {
      const legacyPayment = await LegacyPayment.get(id);
      return new Payment(
        legacyPayment.id,
        legacyPayment.member_id,
        legacyPayment.currency_code,
        legacyPayment.amount,
        legacyPayment.created_at
      );
    } catch (e) {
      return null;
    }
  }
}
