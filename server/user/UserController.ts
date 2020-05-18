import { UserRepository } from "./UserRepository"
import { User } from "./User"
import * as UserRepositoryProvider from "./UserRepositoryProvider"

type MeResponse = {
    id: number,
    role: string
}

function createMeResponse(user: User): MeResponse {
    return {
        id: user.id,
        role: user.role
    }
}

export async function me(userId: number): Promise<any> {
    // todo: disapproves of the global stuff
    const repo = UserRepositoryProvider.provide();
    const maybe = await repo.get(userId)
    if (maybe == null) return null
    return createMeResponse(maybe)
}
