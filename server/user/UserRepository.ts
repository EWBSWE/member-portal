import { UnsavedUser, User } from './User'
import { deserialize } from "./Role"
import { UserEntity } from './UserEntity';
import { UserStore } from './UserStore';

export class UserRepository {
    private userStore: UserStore

    constructor(userStore: UserStore) {
        this.userStore = userStore;
    }

    async add(user: UnsavedUser): Promise<User> {
        const entity = UserEntity.createFrom(user);
        const updated = await this.userStore.create(entity)
        return new User(updated.id!!, updated.username, deserialize(updated.role))
    }

    async get(id: number): Promise<User | null> {
        const maybe = await this.userStore.get(id)
        if (!maybe) return null
        return new User(maybe.id!!, maybe.username, deserialize(maybe.role))
    }

    async all(): Promise<User[]> {
        const all = await this.userStore.all()
        return all.map(entity => new User(entity.id!!, entity.username, deserialize(entity.role)))
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
        await this.userStore.changePassword(user.id, user.resetToken!)
    }
}
