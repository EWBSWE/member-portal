import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";

export type ConfirmMembershipRequest = {
  email: string;
  productId: number;
  stripeToken: any;

  name: string | null;
  location: string | null;
  profession: string | null;
  education: string | null;
  gender: string | null;
  employer: string | null;
  yearOfBirth: number | null;
  chapterId: number | null;
};

const schema = Joi.object<ConfirmMembershipRequest>({
  email: Joi.string().required(),
  productId: Joi.number().required(),
  stripeToken: Joi.object().required(),

  name: Joi.string().optional().allow(null),
  location: Joi.string().optional().allow(null),
  profession: Joi.string().optional().allow(null),
  education: Joi.string().optional().allow(null),
  gender: Joi.string().optional().allow(null),
  employer: Joi.string().optional().allow(null),
  yearOfBirth: Joi.number().min(0).max(10000).optional().allow(null),
  chapterId: Joi.number().optional().allow(null),
});

export function parseConfirmMembershipParams(
  params: any
): ValidationResult<ConfirmMembershipRequest> {
  return parseParams(params, schema);
}
