import { OutgoingMessageEntity } from "./OutgoingMessageEntity";

export class OutgoingMessage {
  readonly recipient: string;
  readonly sender: string;
  readonly subject: string;
  readonly body: string;

  constructor(
    recipient: string,
    sender: string,
    subject: string,
    body: string
  ) {
    this.recipient = recipient;
    this.sender = sender;
    this.subject = subject;
    this.body = body;
  }

  toEntity(): OutgoingMessageEntity {
    return {
      recipient: this.recipient,
      sender: this.sender,
      subject: this.subject,
      body: this.body,
    };
  }
}
