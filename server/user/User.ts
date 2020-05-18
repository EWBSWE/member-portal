export class User {
    readonly username: string
    readonly role: string

    constructor(username: string, role: string) {
        this.username = username;
        this.role = role;
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
