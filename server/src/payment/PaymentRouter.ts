import * as express from "express";
import * as auth from "../auth/auth.service";
import { SqlProvider } from "../SqlProvider";
import { db } from "../Db";
import { createHandlerNoInput, createHandler } from "../createHandler";
import { PaymentController } from "./PaymentController";
import { EventRepository } from "../event/EventRepository";
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository";
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory";
import { parseConfirmEventPayment } from "./ConfirmEventPaymentRequest";

const noReply = process.env.NO_REPLY;
const appUrl = process.env.APP_URL;
const outgoingMessageFactory = new OutgoingMessageFactory(noReply!, appUrl!);
const eventRepository = new EventRepository(db, SqlProvider);
const outgoingMessageRepository = new OutgoingMessageRepository(
  db,
  SqlProvider
);

const controller = new PaymentController(
  eventRepository,
  outgoingMessageRepository,
  outgoingMessageFactory
);

const router = express.Router();

router.get("/stripe-checkout", createHandlerNoInput(controller.checkoutKey));
router.post(
  "/confirm-event",
  createHandler(
    (req: express.Request) => req.body,
    parseConfirmEventPayment,
    controller.confirmEventPayment.bind(controller)
  )
);

export default router;
