import { assert } from "chai";
import { parseCreateEventRequest } from "../../src/event/CreateEventRequest";

describe("CreateEventRequest", function () {
  it("allows well formed input", function () {
    const json = createDummyEvent();
    const result = parseCreateEventRequest(json);
    assert.isTrue(result.success);
  });

  it("rejects empty addons", function () {
    const emptyAddons: any = [];
    const json = createEvent(emptyAddons, createDummySubscribers());
    const result = parseCreateEventRequest(json);
    assert.isFalse(result.success);
  });

  it("rejects empty subscribers", function () {
    const emptySubscribers: any = [];
    const json = createEvent(createDummyAddons(), emptySubscribers);
    const result = parseCreateEventRequest(json);
    assert.isFalse(result.success);
  });

  it("rejects negative price", function () {
    const negativePrice = createAddon(-1, 100);
    const json = createEvent([negativePrice], createDummySubscribers());
    const result = parseCreateEventRequest(json);
    assert.isFalse(result.success);
  });

  it("rejects negative capacity", function () {
    const negativeCapacity = createAddon(100, -1);
    const json = createEvent([negativeCapacity], createDummySubscribers());
    const result = parseCreateEventRequest(json);
    assert.isFalse(result.success);
  });
});

function createDummyAddons(): any {
  return [createAddon(100, 100), createAddon(20, 200), createAddon(0, 300)];
}

function createDummySubscribers(): any {
  return ["dummy@mail"];
}

function createDummyEvent(): any {
  return createEvent(createDummyAddons(), createDummySubscribers());
}

function createAddon(price: any, capacity: any): any {
  return {
    name: "Dummy name",
    description: "Dummy description",
    price,
    capacity,
  };
}

function createEvent(addons: any, subscribers: any): any {
  return {
    name: "Dummy name",
    identifier: "dummy-name",
    description: "Dummy description",
    active: "true",
    contact: "dummy@email",
    emailTemplate: {
      subject: "Dummy subject",
      body: "Dummy body",
    },
    notificationOpen: "false",
    subscribers: subscribers,
    dueDate: "2020-01-01",
    addons: addons,
  };
}
