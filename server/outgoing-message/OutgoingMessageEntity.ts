export class OutgoingMessageEntity {
    readonly recipient: string;
    readonly sender: string;
    readonly subject: string;
    readonly body: string;

    constructor(recipient: string, sender: string, subject: string, body: string) {
        this.recipient = recipient;
        this.sender = sender;
        this.subject = subject;
        this.body = body;
    }
}
