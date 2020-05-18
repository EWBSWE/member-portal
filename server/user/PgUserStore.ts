import { UserEntity } from './UserEntity';
import { db } from '../db';
import { SqlProvider } from "../SqlProvider"
import { UserStore } from './UserStore';

export class PgUserStore implements UserStore {
    readonly sqlProvider: SqlProvider

    constructor(sqlProvider: SqlProvider) {
        this.sqlProvider = sqlProvider;
    }

    async create(entity: UserEntity): Promise<UserEntity> {
        const result = await db.one(this.sqlProvider.insertUser, [entity.username, entity.hashedPassword, entity.salt, entity.role]);
        return new UserEntity(result.id, entity.username, entity.hashedPassword, entity.salt, entity.role);
    }

    async get(id: number): Promise<UserEntity | null> {
        const result = await db.oneOrNone(this.sqlProvider.UserById, [id]);
        if (result == null) return null
        return new UserEntity(result.id, result.username, result.hashed_password, result.salt, result.role);
    }
}
