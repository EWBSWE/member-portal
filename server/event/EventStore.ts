import { EventEntity } from "../api/event/EventEntity";

export interface EventStore {
    findAll(): Promise<EventEntity[]>
    findById(id: number): Promise<EventEntity | null>
    findBySlug(slug: string): Promise<EventEntity | null>
}
