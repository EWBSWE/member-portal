import { Result, fail, ok, empty } from "../Result";
import { EventRepository } from "../event/EventRepository";
import logger = require("../config/logger");
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory";
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository";
import { ConfirmEventPayment } from "./ConfirmEventPaymentRequest";
import { processCharge2, getCheckoutKey } from "../Stripe";

type CheckoutResponse = {
  key: string;
};

export class PaymentController {
  private readonly eventRepository: EventRepository;
  private readonly outgoingMessageRepository: OutgoingMessageRepository;
  private readonly outgoingMessageFactory: OutgoingMessageFactory;

  constructor(
    eventRepository: EventRepository,
    outgoingMessageRepository: OutgoingMessageRepository,
    outgoingMessageFactory: OutgoingMessageFactory
  ) {
    this.eventRepository = eventRepository;
    this.outgoingMessageRepository = outgoingMessageRepository;
    this.outgoingMessageFactory = outgoingMessageFactory;
  }

  async checkoutKey(): Promise<Result<CheckoutResponse>> {
    const key = getCheckoutKey();
    if (!key) throw new Error("Missing Stripe checkout key");
    return ok({ key });
  }

  async confirmEventPayment(
    request: ConfirmEventPayment
  ): Promise<Result<void>> {
    const event = await this.eventRepository.findByPublicIdentifier(
      request.identifier
    );
    if (event == null)
      return fail(`Event with identifier ${request.identifier} not found`);

    const selectedAddons = event.addons.filter((addon) =>
      request.addonIds.includes(addon.id)
    );
    const sum = selectedAddons.reduce((total, addon) => total + addon.price, 0);

    logger.info("Initiating event payment", event);
    if (sum === 0 && request.stripeToken) {
      return fail("Unexpected 0 cost with Stripe token");
    } else if (request.stripeToken) {
      // only process charge if stripe token is present
      try {
        await processCharge2(request.stripeToken, "SEK", sum, event.name);
      } catch (e) {
        logger.info("Payment failed");
        return fail("Stripe rejected");
      }
    }

    await this.eventRepository.addParticipant(
      event,
      selectedAddons,
      request.participant
    );

    logger.info("Create receipt mail");
    const receiptMail = this.outgoingMessageFactory.receipt(
      request.participant.email,
      selectedAddons
    );
    await this.outgoingMessageRepository.enqueue(receiptMail);

    logger.info("Create event mail");
    const eventMail = this.outgoingMessageFactory.fromTemplate(
      request.participant.email,
      event.emailTemplate
    );
    await this.outgoingMessageRepository.enqueue(eventMail);

    logger.info("All done");

    return empty();
  }
}
