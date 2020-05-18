import { UserEntity } from './UserEntity';

export interface UserStore {
    create(entity: UserEntity): Promise<UserEntity>
    get(id: number): Promise<UserEntity | null>
}
