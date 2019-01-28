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
    }
    formatResponse() {
        const response = {
            id: this.id,
            name: this.name,
            identifier: this.identifier,
            active: this.active,
            dueDate: this.dueDate,
            due_date: this.dueDate,
            notificationOpen: this.notificationOpen,
            createdAt: this.createdAt,
            created_at: this.createdAt,
        };
        if (this.subscribers) {
            response.subscribers = this.subscribers.map((s) => s.formatResponse());
        }
        if (this.participants) {
            response.participants = this.participants.map((p) => p.formatResponse());
        }
        if (this.payments) {
            response.payments = this.payments.map((p) => p.formatResponse());
        }
        if (this.addons) {
            response.addons = this.addons.map((p) => p.formatResponse());
        }
        return response;
    }
    formatPublicResponse() {
        const response = {
            id: this.id,
            name: this.name,
            identifier: this.identifier,
            active: this.active,
            dueDate: this.dueDate,
            due_date: this.dueDate,
            notificationOpen: this.notificationOpen,
            notification_open: this.notificationOpen,
            createdAt: this.createdAt,
            created_at: this.createdAt,
        };
        if (this.addons) {
            response.addons = this.addons.map((p) => p.formatResponse());
        }
        return response;
    }
}
exports.Event = Event;
//# sourceMappingURL=Event.js.map