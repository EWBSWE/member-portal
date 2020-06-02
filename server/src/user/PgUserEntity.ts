import { UserEntity } from "./UserEntity";

export type PgUserEntity = {
    id: number;
    username: string;
    hashed_password: string;
    salt: string;
    role: string;
    sender: string;
    reset_token?: string;
    reset_validity?: Date;
};

export function toUserEntity(row: PgUserEntity): UserEntity {
    const entity = new UserEntity(row.id, row.username, row.hashed_password, row.salt, row.role)
    entity.resetToken = row.reset_token
    entity.resetValidity = row.reset_validity
    return entity
}
