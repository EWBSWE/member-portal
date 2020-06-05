import { assert } from "chai";
import { Result } from "../src/Result";

export function assertResultMessage<T>(result: Result<T>, regexp: RegExp) {
  if (result.success) {
    throw new Error(`Expected result message but was ${result}`);
  } else {
    assert.match(result.message, regexp);
  }
}

export function assertResultData<T>(result: Result<T>, assert: (t: T) => void) {
  if (result.success) {
    if (result.hasData) {
      assert(result.data);
    } else {
      throw new Error(`Expected result but was empty`);
    }
  } else {
    throw new Error(
      `Expected result with data but failed with message ${result.message}`
    );
  }
}

export function assertResultEmpty<T>(result: Result<T>) {
  if (result.success) {
    if (result.hasData) {
      throw new Error(
        `Expected result to be empty but has data ${result.data}`
      );
    } else {
      // all good
    }
  } else {
    throw new Error(
      `Expected result to be empty but failed with message ${result.message}`
    );
  }
}
