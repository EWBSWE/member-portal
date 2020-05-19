import { UserEntity } from './UserEntity';

export interface UserStore {
    create(entity: UserEntity): Promise<UserEntity>
    get(id: number): Promise<UserEntity | null>
    all(): Promise<UserEntity[]>
    remove(id: number): Promise<void>
    findByEmail(email: string): Promise<UserEntity | null>
    changePassword(id: number, token: string): Promise<void>
}
