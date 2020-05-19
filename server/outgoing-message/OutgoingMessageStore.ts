import { OutgoingMessageEntity } from "./OutgoingMessageEntity";

export interface OutgoingMessageStore {
    create(entity: OutgoingMessageEntity): Promise<void>;
}
