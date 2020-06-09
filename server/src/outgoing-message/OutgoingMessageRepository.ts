import { OutgoingMessage, UnsavedOutgoingMessage } from "./OutgoingMessage";
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

  async enqueue(message: UnsavedOutgoingMessage): Promise<void> {
    const params = [
      message.recipient,
      message.sender,
      message.subject,
      message.body,
    ];
    await this.db.any<OutgoingMessageEntity>(
      this.sqlProvider.InsertOutgoingMessage,
      params
    );
  }

  async fetch(limit: number): Promise<OutgoingMessage[]> {
    const result = await this.db.any<OutgoingMessageEntity>(
      this.sqlProvider.OutgoingMessages,
      limit
    );
    return result.map(OutgoingMessage.fromEntity);
  }

  async remove(id: number): Promise<void> {
    await this.db.any(this.sqlProvider.OutgoingMessageDelete, id);
  }

  async update(message: OutgoingMessage): Promise<void> {
    const entity = message.toEntity();
    const params = [entity.id, entity.failed_attempts];
    await this.db.any(this.sqlProvider.OutgoingMessageUpdate, params);
  }
}
