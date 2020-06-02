import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";

export type CreateMemberRequest = {
  email: string;
  expirationDate: Date;
  memberTypeId: number;
  location: string;

  name: string | null;
  gender: string | null;
  education: string | null;
  employer: string | null;
  profession: string | null;
  yearOfBirth: number | null;
  chapterId: number | null;
};

const schema = Joi.object<CreateMemberRequest>({
  email: Joi.string().required(),
  expirationDate: Joi.date().iso().required(),
  location: Joi.string().required(),
  memberTypeId: Joi.number().required(),

  name: Joi.string().optional().allow(null),
  gender: Joi.string().optional().allow(null),
  education: Joi.string().optional().allow(null),
  employer: Joi.string().optional().allow(null),
  profession: Joi.string().optional().allow(null),
  yearOfBirth: Joi.number().max(10000).optional().allow(null),
  chapterId: Joi.number().optional().allow(null),
});

export function parseCreateMemberRequest(
  params: any
): ValidationResult<CreateMemberRequest> {
  return parseParams(params, schema);
}
