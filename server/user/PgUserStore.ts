import { UserEntity } from './UserEntity';
import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider"
import { UserStore } from './UserStore';
import { PgUserEntity, toUserEntity } from './PgUserEntity';

export class PgUserStore implements UserStore {
    private readonly db: IDatabase<{}, any>
    private readonly sqlProvider: SqlProvider

    constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
        this.sqlProvider = sqlProvider
        this.db = db
    }
    async create(entity: UserEntity): Promise<UserEntity> {
        const result = await this.db.one(this.sqlProvider.InsertUser, [entity.username, entity.hashedPassword, entity.salt, entity.role, entity.resetToken]);
        return new UserEntity(result.id, entity.username, entity.hashedPassword, entity.salt, entity.role);
    }

    async get(id: number): Promise<UserEntity | null> {
        const result = await this.db.oneOrNone<PgUserEntity>(this.sqlProvider.UserById, [id]);
        if (result == null) return null
        return toUserEntity(result)
    }

    async all(): Promise<UserEntity[]> {
        const result = await this.db.many<PgUserEntity>(this.sqlProvider.Users)
        return result.map(row => toUserEntity(row))
    }

    async remove(id: number): Promise<void> {
        await this.db.any(this.sqlProvider.DeleteUser, [id])
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const result = await this.db.oneOrNone<PgUserEntity>(this.sqlProvider.UserByEmail, [email])
        if (result == null) return null
        return toUserEntity(result)
    }

    async updateResetToken(id: number, token: string): Promise<void> {
        await this.db.one(this.sqlProvider.UserResetPassword, [id, token])
    }

    async findByToken(token: string): Promise<UserEntity | null> {
        const result = await this.db.oneOrNone<PgUserEntity>(this.sqlProvider.UserByToken, [token])
        if (result == null) return null
        return toUserEntity(result)
    }

    async changePassword(id: number, hashed: string, salt: string): Promise<void> {
        await this.db.none(this.sqlProvider.UserChangePassword, [id, hashed, salt])
    }
}
