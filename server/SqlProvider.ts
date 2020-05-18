import { QueryFile } from "pg-promise"
import * as path from "path"

function inflate(pathToFile: string): QueryFile {
    const src = path.join(__dirname, pathToFile);
    return new QueryFile(src, { minify: true });
}

export type SqlProvider = {
    insertUser: QueryFile
    UserById: QueryFile
}

export const SqlProvider: SqlProvider = {
    insertUser: inflate("../sql/InsertUser.sql"),
    UserById: inflate("../sql/UserById.sql"),
}
