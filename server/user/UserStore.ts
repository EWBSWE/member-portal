import { UserEntity } from './UserEntity';
import { db } from '../db';


export interface UserStore {
    create(entity: UserEntity): Promise<UserEntity>
}

export class PgUserStore implements UserStore {
    async create(entity: UserEntity): Promise<UserEntity> {
        const result = await db.one(`
INSERT INTO ewb_user (username, hashed_password, salt, role)
VALUES ($1, $2, $3, $4)
RETURNING *
`, [entity.username, entity.hashedPassword, entity.salt, entity.role]);

        return new UserEntity(result[0], result[1], result[2], result[3]);
    }
}

