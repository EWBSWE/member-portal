import { UserEntity } from './UserEntity';
import { db } from '../db';
import { SqlProvider } from "../SqlProvider"

export interface UserStore {
    create(entity: UserEntity): Promise<UserEntity>
}

export class PgUserStore implements UserStore {
    readonly sqlProvider: SqlProvider

    constructor(sqlProvider: SqlProvider) {
        this.sqlProvider = sqlProvider;
    }

    async create(entity: UserEntity): Promise<UserEntity> {
        const result = await db.one(this.sqlProvider.insertUser, [entity.username, entity.hashedPassword, entity.salt, entity.role]);
        return new UserEntity(result[0], result[1], result[2], result[3]);
    }
}

