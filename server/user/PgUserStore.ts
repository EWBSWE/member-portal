import { UserEntity } from './UserEntity';
import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider"
import { UserStore } from './UserStore';
import { PgUserEntity } from './PgUserEntity';

export class PgUserStore implements UserStore {
    private readonly db: IDatabase<{}, any>
    private readonly sqlProvider: SqlProvider

    constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
        this.sqlProvider = sqlProvider
        this.db = db
    }
    async create(entity: UserEntity): Promise<UserEntity> {
        const result = await this.db.one(this.sqlProvider.insertUser, [entity.username, entity.hashedPassword, entity.salt, entity.role, entity.resetToken]);
        const created = new UserEntity(result.id, entity.username, entity.hashedPassword, entity.salt, entity.role);
        if (entity.resetToken != undefined) {
            created.resetToken = entity.resetToken
        }
        return created
    }

    async get(id: number): Promise<UserEntity | null> {
        const result = await this.db.oneOrNone<PgUserEntity>(this.sqlProvider.UserById, [id]);
        if (result == null) return null
        return this.entityFromRow(result)
    }

    async all(): Promise<UserEntity[]> {
        const result = await this.db.many<PgUserEntity>(this.sqlProvider.Users)
        return result.map(row => this.entityFromRow(row))
    }

    private entityFromRow(row: PgUserEntity): UserEntity {
        return new UserEntity(row.id, row.username, row.hashed_password, row.salt, row.role)
    }

    async remove(id: number): Promise<void> {
        await this.db.any(this.sqlProvider.DeleteUser, [id])
    }
}

