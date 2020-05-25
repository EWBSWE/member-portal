import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const assert = chai.assert

import { PgEventStore } from "../../event/PgEventStore"
import * as sinon from "sinon"
import { SqlProvider } from "../../SqlProvider"
import { PgEventParticipantEntity } from "../../api/event/PgEventParticipantEntity"
import { PgEventEntity } from "../../api/event/PgEventEntity"
import { createTestDb } from "./db"

describe("PgEventStore", function() {
    const sandbox = sinon.createSandbox()

    afterEach(function() {
        sandbox.restore()
    })

    it("fetches events with no participants", async function() {
        const db = createTestDb()

        sandbox.stub(db, "any")
            .onFirstCall() // fetch events
            .resolves([createEvent(1)])
            .onSecondCall() // fetch participants
            .resolves([])

        const sut = new PgEventStore(db, SqlProvider)
        const result = await sut.findAll()

        assert.equal(1, result.length)
        assert.equal(0, result[0].participants.length)
    })

    it("attaches participants when finding event", async function() {
        const db = createTestDb()

        sandbox.stub(db, "any")
            .onFirstCall()
            .resolves([createEvent(1)])
            .onSecondCall()
            .resolves([createParticipant(1)])

        const sut = new PgEventStore(db, SqlProvider)
        const result = await sut.findAll()

        assert.equal(1, result.length)
        assert.equal(1, result[0].participants.length)
    })
})

function createEvent(id: number): PgEventEntity {
    return  {
        id: id,
        name: "Test event",
        description: "Test description",
        identifier: "test",
        active: true,
        created_at: new Date(1000),
        updated_at: new Date(1000),
        due_date: new Date(10000),
        email_template_id: 1,
        notification_open: true
    }
}

function createParticipant(eventId: number): PgEventParticipantEntity {
    const dummyMemberId = 1
    return { name: "Dummy name", email: "Dummy email", event_id: eventId, member_id: dummyMemberId}
}
