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

export async function me(userId: number): Promise<MeResponse | null> {
    // todo: disapproves of the global stuff
    const repo = UserRepositoryProvider.provide();
    const maybe = await repo.get(userId)
    if (maybe == null) return null
    return createMeResponse(maybe)
}

type AllUsersResponse = {
    email: string,
    role: string
}[]

function createAllUsersResponse(users: User[]): AllUsersResponse {
    return users.map(u => ({
        email: u.username,
        role: u.role
    }))
}

export async function allUsers(): Promise<AllUsersResponse> {
    const repo = UserRepositoryProvider.provide()
    const users = await repo.all()
    return createAllUsersResponse(users)
}
