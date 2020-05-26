import { PgEmailTemplateEntity } from "./PgEmailTemplateEntity";

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

  toEntity(): PgEmailTemplateEntity {
    return {
      id: this.id,
      sender: this.sender,
      subject: this.subject,
      body: this.body,
    };
  }

  static fromEntity(entity: PgEmailTemplateEntity): EmailTemplate {
    return new EmailTemplate(
      entity.id,
      entity.sender,
      entity.subject,
      entity.body
    );
  }
}
