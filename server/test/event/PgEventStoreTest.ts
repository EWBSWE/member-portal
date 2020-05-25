import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const assert = chai.assert;

import { PgEventStore } from "../../event/PgEventStore";
import * as sinon from "sinon";
import { SqlProvider } from "../../SqlProvider";
import { PgEventParticipantEntity } from "../../api/event/PgEventParticipantEntity";
import { PgEventEntity } from "../../api/event/PgEventEntity";
import { createTestDb } from "./db";

describe("PgEventStore", function () {
  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
  });
});

function createEvent(id: number): PgEventEntity {
  return {
    id: id,
    name: "Test event",
    description: "Test description",
    identifier: "test",
    active: true,
    created_at: new Date(1000),
    updated_at: new Date(1000),
    due_date: new Date(10000),
    email_template_id: 1,
    notification_open: true,
  };
}

function createParticipant(eventId: number): PgEventParticipantEntity {
  const dummyMemberId = 1;
  return {
    name: "Dummy name",
    email: "Dummy email",
    event_id: eventId,
    member_id: dummyMemberId,
  };
}
