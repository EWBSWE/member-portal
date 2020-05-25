import { EmailTemplateEntity } from "./EmailTemplateEntity";

export type PgEmailTemplateEntity = {
    id: number
    sender: string
    subject: string
    body: string
};

export function toEmailTemplateEntity(row: PgEmailTemplateEntity): EmailTemplateEntity {
    return {
        id: row.id,
        sender: row.sender,
        subject: row.subject,
        body: row.body
    }
}
