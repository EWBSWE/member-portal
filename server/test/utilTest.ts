import { assert } from "chai";
import { groupBy } from "../src/util";

describe("groupBy", function () {
  it("create map of collection", function () {
    const input = [1, 2, 3, 4];
    const result = groupBy(input, (something) => something);
    assert.equal(result.size, 4, "Expected 4 keys");
  });

  it("create map of empty collection", function () {
    const input: any[] = [];
    const result = groupBy(input, (something) => something);
    assert.equal(result.size, 0, "Expected result to be empty");
  });
});
