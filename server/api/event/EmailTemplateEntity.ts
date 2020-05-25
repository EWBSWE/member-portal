import { EmailTemplate } from "./EmailTemplate";

export type EmailTemplateEntity = {
  id: number;
  sender: string;
  subject: string;
  body: string;
};

export function fromEmailTemplate(
  template: EmailTemplate
): EmailTemplateEntity {
  return {
    id: template.id,
    sender: template.sender,
    subject: template.subject,
    body: template.body,
  };
}

export function toEmailTemplateEntity(
  template: EmailTemplate
): EmailTemplateEntity {
  return {
    id: template.id,
    sender: template.sender,
    subject: template.subject,
    body: template.body,
  };
}
