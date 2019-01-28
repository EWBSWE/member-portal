"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=EventPayment.js.map