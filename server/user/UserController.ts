import { UserRepository } from "./UserRepository"
import { User } from "./User"
import { serialize } from "./Role"
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository"
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory"
import { UserFactory } from "./UserFactory"
import { createResetToken, createPassword, resetPasswordAllowed } from "./PasswordService"

type MeResponse = {
    id: number,
    role: string
}

function createMeResponse(user: User): MeResponse {
    return {
        id: user.id,
        role: serialize(user.role)
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
        role: serialize(user.role)
    }))
}

type CreateUserResponse = {
}


export class UserController {
    private userFactory: UserFactory
    private userRepository: UserRepository
    private messageRepository: OutgoingMessageRepository
    private messageFactory: OutgoingMessageFactory

    constructor(userFactory: UserFactory, userRepository: UserRepository, messageRepository: OutgoingMessageRepository, messageFactory: OutgoingMessageFactory) {
        this.userFactory = userFactory
        this.userRepository = userRepository
        this.messageRepository = messageRepository
        this.messageFactory = messageFactory
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
        const user = this.userFactory.create(email)
        await this.userRepository.add(user)

        const message = this.messageFactory.userCreated(email)
        await this.messageRepository.enqueue(message)

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

    async resetPassword(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email)
        if (user == null) throw new Error(`No user with ${email} found`)
        user.resetToken = createResetToken()
        await this.userRepository.updateResetToken(user)

        const message = this.messageFactory.resetPassword(email, user.resetToken)
        await this.messageRepository.enqueue(message)
    }

    async setPassword(token: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findByToken(token)
        if (user == null) throw new Error(`No user found with token`)
        if (!resetPasswordAllowed(user)) throw new Error("User outside reset period")
        await this.userRepository.changePassword(user, createPassword(newPassword))
    }
}
