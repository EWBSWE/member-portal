import { UserRepository } from "./UserRepository"
import { PgUserStore } from "./PgUserStore"
import { SqlProvider } from "../SqlProvider"

let instance: UserRepository | null = null

export function provide(): UserRepository {
    if (instance == null) {
        instance = new UserRepository(new PgUserStore(SqlProvider))
    }
    return instance
}
