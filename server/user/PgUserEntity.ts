
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
