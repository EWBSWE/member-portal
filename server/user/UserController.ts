import { UserRepository } from "./UserRepository"
import { User, UnsavedUser } from "./User"
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
    id: number
    email: string
    role: string
}[]

function createAllUsersResponse(users: User[]): AllUsersResponse {
    return users.map(user => ({
        id: user.id,
        email: user.username,
        role: user.role
    }))
}

export async function allUsers(): Promise<AllUsersResponse> {
    const repo = UserRepositoryProvider.provide()
    const users = await repo.all()
    return createAllUsersResponse(users)
}


type CreateUserResponse = {
}

export async function createUser(email: string): Promise<CreateUserResponse> {
    const repo = UserRepositoryProvider.provide()
    const defaultPassword = "Change by reset password?"
    const user = new UnsavedUser(email, defaultPassword, "user")
    const maybeCreated = await repo.add(user)
    return {}
}

export async function removeUser(currentUserId: number, userIdToRemove: number): Promise<void> {
    const repo = UserRepositoryProvider.provide()
    const currentUser = await repo.get(currentUserId)
    const otherUser = await repo.get(userIdToRemove)

    if (currentUser?.canRemove(otherUser!!)) {
        await repo.remove(otherUser!!)
    } else {
        throw Error(`Current user ${currentUser} not allowed to remove ${otherUser}`)
    }
}
