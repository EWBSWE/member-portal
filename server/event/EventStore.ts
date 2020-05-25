import { EventEntity } from "../api/event/EventEntity";
import { EventDetails } from "./EventDetails"

export interface EventStore {
    findAll(): Promise<EventEntity[]>
    findById(id: number): Promise<EventEntity | null>
    findBySlug(slug: string): Promise<EventEntity | null>
    getDetails(entity: EventEntity): Promise<EventDetails>
}
