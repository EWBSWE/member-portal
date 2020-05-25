import * as pgp from "pg-promise";

let db: pgp.IDatabase<{}, any> | null = null;
export function createTestDb(): pgp.IDatabase<{}, any> {
    if (db)
        return db;
    const allowMocking = { noLocking: true };
    const dbInitFunction = pgp(allowMocking);
    db = dbInitFunction("dummy query string");
    return db;
}
