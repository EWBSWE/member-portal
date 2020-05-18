export class User {
    readonly id: number
    readonly username: string
    readonly role: string

    constructor(id: number, username: string, role: string) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    canRemove(other: User): boolean {
        if (this.role == "admin") return true
        return other.role != "admin"
    }
}

export class UnsavedUser {
    readonly username: string
    readonly role: string
    readonly password: string

    constructor(username: string, password: string, role: string) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    toString(): string {
      return `UnsavedUser(username=${this.username} role=${this.role} password=*******)`;
    }
}
