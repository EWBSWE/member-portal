import { UserEntity } from './UserEntity';

export interface UserStore {
    create(entity: UserEntity): Promise<UserEntity>
    get(id: number): Promise<UserEntity | null>
    all(): Promise<UserEntity[]>
    remove(id: number): Promise<void>
    findByEmail(email: string): Promise<UserEntity | null>
    findByToken(token: string): Promise<UserEntity | null>
    updateResetToken(id: number, token: string): Promise<void>
    changePassword(id: number, hashed: string, salt: string): Promise<void>
}
