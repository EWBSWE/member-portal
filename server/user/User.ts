import { Role, deserialize } from "./Role";
import { UserEntity } from "./UserEntity";

export class User {
    readonly id: number
    readonly username: string
    readonly role: Role
    readonly hashedPassword: string
    readonly salt: string

    resetToken?: string
    resetValidity?: Date

    constructor(id: number, username: string, role: Role, hashedPassword: string, salt: string) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.hashedPassword = hashedPassword
        this.salt = salt
    }

    canRemove(other: User): boolean {
        if (this.role == Role.ADMIN) return true
        return other.role != Role.ADMIN
    }

    withinResetPasswordPeriod(): boolean {
        return Date.now() <= this.resetValidity!.getTime()
    }

    static fromEntity(entity: UserEntity): User {
        const user = new User(entity.id!, entity.username, deserialize(entity.role), entity.hashedPassword, entity.salt)
        user.resetToken = entity.resetToken
        user.resetValidity = entity.resetValidity
        return user
    }
}

export class UnsavedUser {
    readonly username: string
    readonly role: Role
    readonly password: string

    resetToken?: string

    constructor(username: string, password: string, role: Role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    toString(): string {
        return `UnsavedUser(username=${this.username} role=${this.role} password=*******)`;
    }
}

