import { assert } from "chai";
import Joi = require("@hapi/joi");
import { parseParams } from "../RequestValidation";

describe("RequestValidation", function () {
  describe("parseParams", function () {
    const schema = Joi.object({
      id: Joi.number().required(),
    });

    it("converts strings to numbers", function () {
      const { value, error } = schema.validate({ id: "4" });
      assert.strictEqual(4, value.id);
      assert.isUndefined(error);
    });

    it("error when malformed input", function () {
      const { error } = schema.validate({ id: "not a number" });
      assert.isDefined(error);
    });

    it("success false when failed to parse params", function () {
      const result = parseParams({}, schema);
      assert.equal(false, result.success);
    });

    it("success true when parsed params", function () {
      const result = parseParams({ id: 4 }, schema);
      assert.equal(true, result.success);
    });
  });
});
