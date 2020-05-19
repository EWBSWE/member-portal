import { UserRepository } from "./UserRepository"
import { User, UnsavedUser } from "./User"

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

type CreateUserResponse = {
}


export class UserController {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async me(userId: number): Promise<MeResponse | null> {
        const maybe = await this.userRepository.get(userId)
        if (maybe == null) return null
        return createMeResponse(maybe)
    }

    async allUsers(): Promise<AllUsersResponse> {
        const users = await this.userRepository.all()
        return createAllUsersResponse(users)
    }

    async createUser(email: string): Promise<CreateUserResponse> {
        const defaultPassword = "Change by reset password?"
        const user = new UnsavedUser(email, defaultPassword, "user")
        const maybeCreated = await this.userRepository.add(user)
        return {}
    }

    async removeUser(currentUserId: number, userIdToRemove: number): Promise<void> {
        const currentUser = await this.userRepository.get(currentUserId)
        const otherUser = await this.userRepository.get(userIdToRemove)

        if (currentUser?.canRemove(otherUser!!)) {
            await this.userRepository.remove(otherUser!!)
        } else {
            throw Error(`Current user ${currentUser} not allowed to remove ${otherUser}`)
        }
    }
}
