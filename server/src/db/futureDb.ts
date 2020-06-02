// import {IMain, IDatabase} from 'pg-promise';
// import * as pgPromise from 'pg-promise';

// import * as environment from '../config/environment';

// const pgp: IMain = pgPromise({
//     query(e: any) {
//         console.log(e.query);
//     }
// });

// const cn: string = 'postgres://username:password@host:port/database';

// const db: IDatabase<any> = pgp({
//     host: environment.db.host,
//     port: environment.db.port,
//     database: environment.db.database,
//     user: environment.db.user,
//     password: environment.db.password,
// });

// TODO(dan) 27/01/19: Until greater progress has been made in the Typescript realm we wrap the current db connection
const db = require('./index').db;
export = db;
