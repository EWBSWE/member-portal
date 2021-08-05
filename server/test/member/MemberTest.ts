import { assert } from "chai";
import { Member } from "../../src/member/Member";
import { MemberType } from "../../src/member/MemberType";
import { Gender } from "../../src/member/Gender";
import moment = require("moment");

describe("Member", function () {
  it("extends past expiration date from current date", function () {
    const oldDate = moment().subtract(100, "days").toDate();
    const member = createMember(oldDate);
    member.extendExpirationDate(10);

    assert.isTrue(
      moment(member.expirationDate!!)
        .startOf("day")
        .isSame(moment().startOf("day").add(10, "days"))
    );
  });

  it("extends expiration date from future date", function () {
    const oldDate = moment().add(100, "days").toDate();
    const member = createMember(oldDate);
    member.extendExpirationDate(10);

    assert.isTrue(
      moment(member.expirationDate!!)
        .startOf("day")
        .isSame(moment().startOf("day").add(110, "days"))
    );
  });

  it("creates expiration date if none", function () {
    const member = createMember(null);
    member.extendExpirationDate(10);

    assert.isTrue(
      moment(member.expirationDate!!)
        .startOf("day")
        .isSame(moment().startOf("day").add(10, "days"))
    );
  });
});

function createMember(expirationDate: Date | null): Member {
  return new Member(
    1,
    "email",
    new Date(),
    new Date(),
    null,
    null,
    null,
    null,
    MemberType.STUDENT,
    Gender.OTHER,
    null,
    expirationDate,
    null,
    null
  );
}
