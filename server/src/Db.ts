import { deserialize, AppEnv } from "./AppEnv";
import { IDatabase } from "pg-promise";

const env = deserialize(process.env.NODE_ENV!);

const options = {
  query: function (e: any) {
    if (env === AppEnv.DEVELOPMENT) {
      console.log(e.query);
    }
  },
  error: function (error: any, e: any) {
    console.log(error, e);
    if (e.cn) {
      console.log(`CN: ${e.cn}`);
      console.log(`EVENT: ${error.message || error}`);
    }
  },
};

const pgp = require("pg-promise")(options);
export const db: IDatabase<{}, any> = pgp(process.env.DB_URI);

if (env !== AppEnv.TEST) {
  db.func("version")
    .then((version: any) => console.log("Connected to DB"))
    .catch((e: Error) => console.log("DB Connection failed"));
}
