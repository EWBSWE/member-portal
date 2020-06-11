import { parseConfirmMembershipParams } from "../../src/member/ConfirmMembershipRequest";
import { assert } from "chai";

describe("ConfirmMembershipRequest", function () {
  it("require only necessary params", function () {
    const params = {
      email: "dummy@email.com",
      productId: 4,
      stripeToken: {},
    };
    const result = parseConfirmMembershipParams(params);
    assert.isTrue(result.success);
  });

  it("allow optional params to be null", function () {
    const params = {
      email: "dummy@email.com",
      productId: 4,
      stripeToken: {},
      name: null,
      location: null,
      profession: null,
      education: null,
      gender: null,
      yearOfBirth: null,
      chapterId: null,
    };
    const result = parseConfirmMembershipParams(params);
    assert.isTrue(result.success);
  });

  it("allow empty string on optional params", function () {
    const params = {
      email: "dummy@email.com",
      productId: 4,
      stripeToken: {},
      name: "",
      location: "",
      profession: "",
      education: "",
      gender: "",
      yearOfBirth: null,
      chapterId: null,
    };
    const result = parseConfirmMembershipParams(params);
    assert.isTrue(result.success);
  });
});
