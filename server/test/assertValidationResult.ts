import { ValidationResult } from "../src/RequestValidation";
import { assert } from "chai";

export function assertValidationResult<T>(
  result: ValidationResult<T>,
  assert: (t: T) => any
) {
  if (result.success) {
    assert(result.value);
  } else {
    throw new Error(`Expected result but got error ${result.error.message}`);
  }
}

export function assertValidationResultError<T>(
  result: ValidationResult<T>,
  regexp: RegExp
) {
  if (result.success) {
    throw new Error(
      `Expected result message but was ${JSON.stringify(result.value)}`
    );
  } else {
    assert.match(result.error.message, regexp);
  }
}
