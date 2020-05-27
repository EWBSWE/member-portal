import Joi = require("@hapi/joi");

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: Joi.ValidationError };

export function parseParams<T>(
  params: any,
  validator: Joi.ObjectSchema<T>
): ValidationResult<T> {
  const { value, error } = validator.validate(params);
  if (error) return { success: false, error };
  if (value) return { success: true, value };
  throw new Error(`No error or value from validated params ${params}`);
}
