"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = require("./Event");
const NotImplementedError_1 = require("../../NotImplementedError");
function toEvent(entity) {
    return new Event_1.Event(entity.id, entity.name, entity.identifier, entity.active, entity.due_date, entity.notification_open, entity.created_at, entity.updated_at);
}
exports.toEvent = toEvent;
function toEventEntity(event) {
    throw new NotImplementedError_1.NotImplementedError();
}
exports.toEventEntity = toEventEntity;
//# sourceMappingURL=EventModelEntityMapper.js.map