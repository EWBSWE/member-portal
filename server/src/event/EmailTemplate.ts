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

  toEntity(): EmailTemplateEntity {
    return {
      id: this.id,
      sender: this.sender,
      subject: this.subject,
      body: this.body,
    };
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

export class UnsavedEmailTemplate {
  readonly subject: string;
  readonly body: string;
  readonly sender: string;

  constructor(subject: string, body: string, sender: string) {
    this.subject = subject;
    this.body = body;
    this.sender = sender;
  }
}
