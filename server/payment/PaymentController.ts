import { Result, fail, ok } from "../Result";
import { Payment } from "./Payment";
import { PaymentRepository } from "./PaymentRepository";
import stripe = require("../stripe");

type PaymentDetailsResponse = {
  id: number;
  memberId: number;
  currencyCode: string;
  amount: number;
  createdAt: Date;
};

function createPaymentDetailsResponse(
  payment: Payment
): PaymentDetailsResponse {
  return {
    id: payment.id,
    memberId: payment.memberId,
    currencyCode: payment.currencyCode,
    amount: payment.amount,
    createdAt: payment.createdAt,
  };
}

type CheckoutResponse = {
  key: string;
};

export class PaymentController {
  async checkoutKey(): Promise<Result<CheckoutResponse>> {
    const key = stripe.getCheckoutKey();
    if (!key) throw new Error("Missing Stripe checkout key");
    return ok({ key });
  }

  async confirmEventPayment(): Promise<void> {
    throw new Error("NOT IMPLEMENTED YET");
  }
}
