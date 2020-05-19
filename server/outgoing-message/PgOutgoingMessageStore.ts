import { SqlProvider } from "../SqlProvider";
import { IDatabase } from "pg-promise";
import { OutgoingMessageEntity } from "./OutgoingMessageEntity";
import { OutgoingMessageStore } from "./OutgoingMessageStore";
import { PgOutgoingMessageEntity } from "./PgOutgoingMessageEntity";

export class PgOutgoingMessageStore implements OutgoingMessageStore {
    private readonly db: IDatabase<{}, any>;
    private readonly sqlProvider: SqlProvider;

    constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
        this.sqlProvider = sqlProvider;
        this.db = db;
    }

    async create(entity: OutgoingMessageEntity): Promise<void> {
        const params = [entity.recipient, entity.sender, entity.subject, entity.body];
        await this.db.any<PgOutgoingMessageEntity>(this.sqlProvider.InsertOutgoingMessage, params);
    }
}
