import { UnsavedUser, User } from './User'
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
        return new User(updated.id!!, updated.username, updated.role)
    }

    async get(id: number): Promise<User | null> {
        const maybe = await this.userStore.get(id)
        if (!maybe) return null
        return new User(maybe.id!!, maybe.username, maybe.role)
    }

    async all(): Promise<User[]> {
        const all = await this.userStore.all()
        return all.map(entity => new User(entity.id!!, entity.username, entity.role))
    }
}
