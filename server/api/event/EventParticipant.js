"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=EventParticipant.js.map