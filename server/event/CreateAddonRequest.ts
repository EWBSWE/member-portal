import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";

export type CreateAddonRequest = {
    eventId: number;
    name: string;
    description: string;
    price: number;
    capacity: number;
};

const CreateAddonRequestSchema = Joi.object<CreateAddonRequest>({
    eventId: Joi.number().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
    capacity: Joi.number().required().min(0),
});

export function parseCreateAddonRequest(params: any): ValidationResult<CreateAddonRequest> {
    return parseParams(params, CreateAddonRequestSchema)
}
