import * as crypto from 'crypto';

function hash(text: string, salt: string): string {
    const buffer = Buffer.from(salt, 'base64');
    return crypto.pbkdf2Sync(text, buffer, 10000, 64, 'sha512').toString('base64');

}

function createSalt(): string {
    return crypto.randomBytes(16).toString('base64')
}

class Password {
    readonly hashed: string
    readonly salt: string

    constructor(hashed: string, salt: string) {
        this.hashed = hashed;
        this.salt = salt;
    }
}

export function createPassword(password: string): Password {
    const salt = createSalt();
    const hashed = hash(password, salt);
    return new Password(hashed, salt);
}

export function authenticate(plain: string, salt: string, hashedPassword: string): boolean {
    return hash(plain, salt) === hashedPassword;
}