import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";

export type UpdateEventRequest = {
    id: number;
    name: string;
    description: string;
    identifier: string;
    active: boolean;
    dueDate: Date;
    contact: string,
    emailTemplate: { subject: string; body: string; };
    notificationOpen: boolean;
    subscribers: string[];
    addons: {
        id: number;
        capacity: number;
        description: string;
        name: string;
        price: number;
        product_id: number;
    }[];
};

const UpdateEventRequestSchema = Joi.object<UpdateEventRequest>({
    id: Joi.number().required(),
    name: Joi.string().required(),
    identifier: Joi.string().required(),
    description: Joi.string().required(),
    active: Joi.boolean().required(),
    contact: Joi.string().required(),
    emailTemplate: Joi.object({
        subject: Joi.string().required(),
        body: Joi.string().required(),
    }).required(),
    notificationOpen: Joi.boolean().required(),
    subscribers: Joi.array().items(Joi.string().required()),
    dueDate: Joi.date().iso().required(),
    addons: Joi.array().items(Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().min(0).required(),
        capacity: Joi.number().min(0).required(),
        product_id: Joi.number().required()
    }).required())
})

export function parseUpdateEventRequest(params: any): ValidationResult<UpdateEventRequest> {
    return parseParams(params, UpdateEventRequestSchema)
}
