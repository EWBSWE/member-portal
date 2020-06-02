import * as Joi from "@hapi/joi";
import { ValidationResult, parseParams } from "../RequestValidation";

export type UpdateAddonRequest = {
    eventId: number;
    addonId: number;
    name: string;
    description: string;
    price: number;
    capacity: number;
};

const UpdateAddonRequestSchema = Joi.object<UpdateAddonRequest>({
    eventId: Joi.number().required(),
    addonId: Joi.number().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
    capacity: Joi.number().required().min(0),
});

export function parseUpdateAddonRequest(
    params: any
): ValidationResult<UpdateAddonRequest> {
    return parseParams(params, UpdateAddonRequestSchema);
}
