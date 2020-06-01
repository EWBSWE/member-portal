import { EventParticipant } from "../event/EventParticipant";
import Joi = require("@hapi/joi");
import { parseParams, ValidationResult } from "../RequestValidation";

export type ConfirmEventPayment = {
  addonIds: number[];
  identifier: string;
  participant: EventParticipant;
  stripeToken?: any;
};

const ConfirmEventPaymentSchema = Joi.object<ConfirmEventPayment>({
  addonIds: Joi.array().items(Joi.number().required()),
  identifier: Joi.string().required(),
  participant: Joi.object({
    email: Joi.string().required(),
    name: Joi.string().required(),
    comment: Joi.string().optional().allow(null),
  }).required(),
  stripeToken: Joi.object().optional().allow(null),
});

export function parseConfirmEventPayment(
  params: any
): ValidationResult<ConfirmEventPayment> {
  return parseParams(params, ConfirmEventPaymentSchema);
}
