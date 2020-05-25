import { EmailTemplateEntity } from "./EmailTemplateEntity";

export class EmailTemplate {
  readonly id: number;
  readonly sender: string;
  subject: string;
  body: string;

  constructor(id: number, sender: string, subject: string, body: string) {
    this.id = id;
    this.sender = sender;
    this.subject = subject;
    this.body = body;
  }

  static fromEntity(entity: EmailTemplateEntity): EmailTemplate {
    return new EmailTemplate(
      entity.id,
      entity.sender,
      entity.subject,
      entity.body
    );
  }
}
