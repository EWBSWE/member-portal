import { UnsavedUser } from './User'
import { Role, serialize } from "./Role"
import { createPassword } from './PasswordService'

export class UserEntity {
    readonly id: number | null
    readonly username: string
    readonly hashedPassword: string
    readonly salt: string
    readonly role: string

    constructor(id: number | null, username: string, hashedPassword: string, salt: string, role: Role) {
        this.id = id 
        this.username = username
        this.hashedPassword = hashedPassword
        this.salt = salt
        this.role = serialize(role)
    }

    static createFrom(user: UnsavedUser): UserEntity {
        const password = createPassword(user.password)
        return new UserEntity(null, user.username, password.hashed, password.salt, user.role);
    }
}
