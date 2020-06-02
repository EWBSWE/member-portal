import { UnsavedUser, User } from './User'
import { UserEntity } from './UserEntity';
import { UserStore } from './UserStore';
import { Password } from "./PasswordService"

export class UserRepository {
    private userStore: UserStore

    constructor(userStore: UserStore) {
        this.userStore = userStore;
    }

    async add(user: UnsavedUser): Promise<User> {
        const entity = UserEntity.createFrom(user);
        const updated = await this.userStore.create(entity)
        return User.fromEntity(updated)
    }

    async get(id: number): Promise<User | null> {
        const maybe = await this.userStore.get(id)
        if (!maybe) return null
        return User.fromEntity(maybe)
    }

    async all(): Promise<User[]> {
        const all = await this.userStore.all()
        return all.map(entity => User.fromEntity(entity))
    }

    async remove(user: User): Promise<void> {
        return this.userStore.remove(user.id)
    }

    async findByEmail(email: string): Promise<User | null> {
        const maybe = await this.userStore.findByEmail(email)
        if (maybe == null) return null
        return User.fromEntity(maybe)
    }

    async updateResetToken(user: User): Promise<void> {
        await this.userStore.updateResetToken(user.id, user.resetToken!)
    }

    async findByToken(token: string): Promise<User | null> {
        const maybe = await this.userStore.findByToken(token)
        if (maybe == null) return null
        return User.fromEntity(maybe)
    }

    async changePassword(user: User, password: Password): Promise<void> {
        await this.userStore.changePassword(user.id, password.hashed, password.salt)
    }
}
