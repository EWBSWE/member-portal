import { OutgoingMessage } from "./OutgoingMessage";
import { OutgoingMessageStore } from "./OutgoingMessageStore";
import { OutgoingMessageEntity } from "./OutgoingMessageEntity";

export class OutgoingMessageRepository {
    private store: OutgoingMessageStore;

    constructor(store: OutgoingMessageStore) {
        this.store = store;
    }

    async enqueue(message: OutgoingMessage): Promise<void> {
        const entity = new OutgoingMessageEntity(message.recipient, message.sender, message.subject, message.body);
        await this.store.create(entity);
    }
}
