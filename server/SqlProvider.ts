import { QueryFile } from "pg-promise"
import * as path from "path"

function inflate(pathToFile: string): QueryFile {
    const src = path.join(__dirname, pathToFile);
    return new QueryFile(src, { minify: true });
}

export type SqlProvider = {
    InsertUser: QueryFile
    UserById: QueryFile
    Users: QueryFile
    DeleteUser: QueryFile
    InsertOutgoingMessage: QueryFile
    UserByEmail: QueryFile
    UserChangePassword: QueryFile
    UserResetPassword: QueryFile
    UserByToken: QueryFile
}

export const SqlProvider: SqlProvider = {
    InsertUser: inflate("../sql/InsertUser.sql"),
    UserById: inflate("../sql/UserById.sql"),
    Users: inflate("../sql/Users.sql"),
    DeleteUser: inflate("../sql/DeleteUser.sql"),
    InsertOutgoingMessage: inflate("../sql/InsertOutgoingMessage.sql"),
    UserByEmail: inflate("../sql/UserByEmail.sql"),
    UserByToken: inflate("../sql/UserByToken.sql"),
    UserChangePassword: inflate("../sql/UserChangePassword.sql"),
    UserResetPassword: inflate("../sql/UserResetPassword.sql"),
}
