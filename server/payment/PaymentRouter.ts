import * as express from "express";
import * as auth from "../auth/auth.service";
import { SqlProvider } from "../SqlProvider";
import * as logger from "../config/logger";
import { db } from "../db";
import { createHandler, createHandlerNoInput } from "../createHandler";
import { PaymentController } from "./PaymentController";

const controller = new PaymentController();

const router = express.Router();

router.get("/stripe-checkout", createHandlerNoInput(controller.checkoutKey));
router.post("/confirm-event", controller.confirmEventPayment);

export default router;
