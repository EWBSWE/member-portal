export type PgOutgoingMessageEntity = {
    id: number
    recipient: string
    sender: string
    subject: string
    body: string
    created_at: Date
    send_at: Date
    failed_attempts: number
};
