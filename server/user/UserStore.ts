import { UserEntity } from './UserEntity';

export interface UserStore {
    create(entity: UserEntity): Promise<UserEntity>
    get(id: number): Promise<UserEntity | null>
    all(): Promise<UserEntity[]>
    remove(id: number): Promise<void>
}
