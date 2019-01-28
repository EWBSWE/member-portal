"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=EmailTemplate.js.map