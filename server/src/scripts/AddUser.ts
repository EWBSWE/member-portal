import * as path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../../env") });

import { UnsavedUser } from "../user/User";
import { UserRepository } from "../user/UserRepository";
import { PgUserStore } from "../user/PgUserStore";
import { SqlProvider } from "../SqlProvider";
import { deserialize } from "../user/Role";
import { db } from "../db";

const repo = new UserRepository(new PgUserStore(db, SqlProvider));

const [, , email, password, role] = process.argv;
const user = new UnsavedUser(email, password, deserialize(role));

console.log(`Creating user ${user}`);

repo
  .add(user)
  .then((user) => {
    console.log(`User ${user} created`);
    process.exit(1);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
