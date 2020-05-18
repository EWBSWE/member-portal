import * as path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '../../env' )});

import { UnsavedUser } from '../user/User'
import { UserRepository } from '../user/UserRepository'
import { PgUserStore } from '../user/UserStore'
import { SqlProvider } from "../SqlProvider"

const repo = new UserRepository(new PgUserStore(SqlProvider));

const [,, email, password, role] = process.argv;
const user = new UnsavedUser(email, password, role);

console.log(`Creating user ${user}`);

repo.add(user)
    .then(user => {
        console.log(`User ${user} created`);
        process.exit(1);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    })
