import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";

export type BulkCreateRequest = {
  members: {
    email: string;
    expirationDate: Date;
    education: string | null;
    gender: string | null;
    location: string | null;
    memberTypeId: number;
    name: string | null;
    profession: string | null;
    yearOfBirth: number | null;
  }[];
};

const schema = Joi.object<BulkCreateRequest>({
  members: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().required(),
        expirationDate: Joi.date().iso().required(),
        education: Joi.string().optional().allow(null),
        gender: Joi.string().optional().allow(null),
        location: Joi.string().optional().allow(null),
        memberType: Joi.string()
          .valid("student", "working", "senior")
          .required(),
        name: Joi.string().optional().allow(null),
        profession: Joi.string().optional().allow(null),
        yearOfBirth: Joi.number().optional().allow(null),
      }).required()
    )
    .required(),
});

export function parseBulkCreateParams(
  params: any
): ValidationResult<BulkCreateRequest> {
  return parseParams(params, schema);
}
