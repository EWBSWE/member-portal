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
class EventParticipant {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }
    formatResponse() {
        return { email: this.email };
    }
    static fromEntity(entity) {
        return new EventParticipant(entity.name, entity.email);
    }
}
exports.EventParticipant = EventParticipant;
class EventSubscriber {
    constructor(email) {
        this.email = email;
    }
    formatResponse() {
        return { email: this.email };
    }
    static fromEntity(entity) {
        return new EventSubscriber(entity.email);
    }
}
exports.EventSubscriber = EventSubscriber;
class EventProduct {
    constructor(id, productId, name, price, capacity, description) {
        this.id = id;
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.capacity = capacity;
        this.description = description;
    }
    formatResponse() {
        return {
            id: this.id,
            productId: this.productId,
            product_id: this.productId,
            name: this.name,
            price: this.price,
            capacity: this.capacity,
            description: this.description
        };
    }
    static fromEntity(entity) {
        return new EventProduct(entity.id, entity.product_id, entity.name, entity.price, entity.capacity, entity.description);
    }
}
exports.EventProduct = EventProduct;
class EmailTemplate {
    constructor(subject, body) {
        this.subject = subject;
        this.body = body;
    }
    static fromEntity(entity) {
        return new EmailTemplate(entity.subject, entity.body);
    }
}
exports.EmailTemplate = EmailTemplate;
class EventPayment {
    constructor(paymentId, name, email, amount, addons, message) {
        this.paymentId = paymentId;
        this.name = name;
        this.email = email;
        this.amount = amount;
        this.message = message;
        this.addons = addons;
    }
    formatResponse() {
        return {
            name: this.name,
            email: this.email,
            amount: this.amount,
            addons: this.addons,
            message: this.message
        };
    }
    static fromEntity(entity) {
        return new EventPayment(entity.payment_id, entity.name, entity.email, entity.amount, entity.addons, entity.message);
    }
}
exports.EventPayment = EventPayment;
//# sourceMappingURL=Event.js.map