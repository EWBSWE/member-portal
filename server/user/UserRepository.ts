import { UnsavedUser, User } from './User'
import { UserEntity } from './UserEntity';
import { UserStore } from './UserStore';

export class UserRepository {
    private userStore: UserStore

    constructor(userStore: UserStore) {
        this.userStore = userStore;
    }

    async add(user: UnsavedUser): Promise<User> {
        const entity = UserEntity.foo(user);
        const updated = await this.userStore.create(entity)
        return new User(updated.username, updated.role);
    }
}

