"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=EventSubscriber.js.map