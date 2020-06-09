import { OutgoingMessageEntity } from "./OutgoingMessageEntity";

export class OutgoingMessage {
  readonly id: number;
  readonly recipient: string;
  readonly sender: string;
  readonly subject: string;
  readonly body: string;
  private failedAttempts: number;

  constructor(
    id: number,
    recipient: string,
    sender: string,
    subject: string,
    body: string,
    failedAttempts: number
  ) {
    this.id = id;
    this.recipient = recipient;
    this.sender = sender;
    this.subject = subject;
    this.body = body;
    this.failedAttempts = failedAttempts;
  }

  fail() {
    this.failedAttempts++;
  }

  toEntity(): OutgoingMessageEntity {
    return {
      id: this.id,
      recipient: this.recipient,
      sender: this.sender,
      subject: this.subject,
      body: this.body,
      failed_attempts: this.failedAttempts,
    };
  }

  static fromEntity(entity: OutgoingMessageEntity): OutgoingMessage {
    return new OutgoingMessage(
      entity.id,
      entity.recipient,
      entity.sender,
      entity.subject,
      entity.body,
      entity.failed_attempts
    );
  }
}

export class UnsavedOutgoingMessage {
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
}
