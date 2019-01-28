import {EmailTemplateEntity} from "./EmailTemplateEntity"

export class EmailTemplate {
	subject: string
	body: string

	constructor(subject: string, body: string) {
		this.subject = subject
		this.body = body
	}

	static fromEntity(entity: EmailTemplateEntity): EmailTemplate {
		return new EmailTemplate(entity.subject, entity.body)
	}
}
