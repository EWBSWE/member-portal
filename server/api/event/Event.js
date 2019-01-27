"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Event {
    constructor(id, name, identifier, active, dueDate, notificationOpen, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.identifier = identifier;
        this.active = active;
        this.dueDate = dueDate;
        this.notificationOpen = notificationOpen;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.participants = 0;
    }
    formatResponse() {
        return {
            id: this.id,
            name: this.name,
            identifier: this.identifier,
            active: this.active,
            dueDate: this.dueDate,
            due_date: this.dueDate,
            notificationOpen: this.notificationOpen,
            participants: this.participants,
            createdAt: this.createdAt,
            created_at: this.createdAt
        };
    }
    formatPublicResponse() {
        return {
            id: this.id,
            name: this.name,
            identifier: this.identifier,
            active: this.active,
            dueDate: this.dueDate,
            notificationOpen: this.notificationOpen
        };
    }
}
exports.Event = Event;
//# sourceMappingURL=Event.js.map