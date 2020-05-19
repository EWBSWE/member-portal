import { Role } from "./Role";

export class User {
    readonly id: number
    readonly username: string
    readonly role: Role

    constructor(id: number, username: string, role: Role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    canRemove(other: User): boolean {
        if (this.role == Role.ADMIN) return true
        return other.role != Role.ADMIN
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

