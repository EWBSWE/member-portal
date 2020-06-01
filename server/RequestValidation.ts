import Joi = require("@hapi/joi");

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: Joi.ValidationError };

export function parseParams<T>(
  params: any,
  validator: Joi.ObjectSchema<T>
): ValidationResult<T> {
  const { value, error } = validator.validate(params);
  if (error) return invalid(error);
  if (value) return valid(value);
  throw new Error(`No error or value from validated params ${params}`);
}

export function valid<T>(value: T): ValidationResult<T> {
  return { success: true, value };
}

export function invalid<T>(error: Joi.ValidationError): ValidationResult<T> {
  return { success: false, error };
}
