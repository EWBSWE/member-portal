import { OutgoingMessage } from "./OutgoingMessage";
import { OutgoingMessageEntity } from "./OutgoingMessageEntity";
import { SqlProvider } from "../SqlProvider";
import { IDatabase } from "pg-promise";

export class OutgoingMessageRepository {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;

  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.sqlProvider = sqlProvider;
    this.db = db;
  }

  async enqueue(message: OutgoingMessage): Promise<void> {
    const entity = message.toEntity();

    const params = [
      entity.recipient,
      entity.sender,
      entity.subject,
      entity.body,
    ];
    await this.db.any<OutgoingMessageEntity>(
      this.sqlProvider.InsertOutgoingMessage,
      params
    );
  }
}
