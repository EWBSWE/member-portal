import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";
export type ShowMemberRequest = { id: number };
const showMemberRequestSchema = Joi.object<ShowMemberRequest>({
  id: Joi.number().required(),
});

export function parseShowMemberParams(
  params: any
): ValidationResult<ShowMemberRequest> {
  return parseParams(params, showMemberRequestSchema);
}
