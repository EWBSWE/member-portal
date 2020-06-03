import { ValidationResult, parseParams } from "../RequestValidation";
import Joi = require("@hapi/joi");

export type UpdateMemberRequest = {
  id: number;
  memberType: string;
  name: string | null;
  expirationDate: Date | null;
  education: string | null;
  gender: string | null;
  location: string | null;
  profession: string | null;
  yearOfBirth: number | null;
  chapterId: number | null;
  employer: string | null;
};

const schema = Joi.object<UpdateMemberRequest>({
  id: Joi.number().required(),
  memberType: Joi.string().valid("student", "working", "senior").required(),
  name: Joi.string().optional().allow(null),
  education: Joi.string().optional().allow(null),
  gender: Joi.string().optional().allow(null),
  location: Joi.string().optional().allow(null),
  profession: Joi.string().optional().allow(null),
  yearOfBirth: Joi.number().optional().allow(null),
  expirationDate: Joi.date().iso().optional().allow(null),
  chapterId: Joi.number().optional().allow(null),
  employer: Joi.string().optional().allow(null),
});

export function parseUpdateMemberParams(
  params: any
): ValidationResult<UpdateMemberRequest> {
  return parseParams(params, schema);
}
