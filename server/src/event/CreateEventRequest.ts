import Joi = require("@hapi/joi");
import { ValidationResult, parseParams } from "../RequestValidation";

export type CreateEventRequest = {
    name: string;
    identifier: string;
    description: string;
    active: boolean;
    contact: string;
    emailTemplate: {
        subject: string;
        body: string;
    };
    notificationOpen: boolean;
    subscribers: string[];
    dueDate: Date;
    addons: {
        name: string;
        price: number;
        description: string;
        capacity: number;
    }[];
};

const CreateEventRequestSchema = Joi.object({
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
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().min(0).required(),
        capacity: Joi.number().min(0).required(),
    }).required())
})

export function parseCreateEventRequest(params: any): ValidationResult<CreateEventRequest> {
    return parseParams(params, CreateEventRequestSchema)
}
