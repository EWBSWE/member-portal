'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const parse = require('csv-parse');
const Promise = require('bluebird');

const db = require(path.join(__dirname, '../server/db')).db;

// MODELS
const Member = require(path.join(__dirname, '../server/models/member.model'));

const inputFiles = {
    //'csv/buyers.csv',
    //'csv/eventaddons.csv',
    //'csv/eventparticipants.csv',
    //'csv/events.csv',
    members: 'csv/members.csv',
    //'csv/payments.csv',
    products: 'csv/products.csv',
    producttypes: 'csv/producttypes.csv',
    //'csv/settings.csv',
    users: 'csv/users.csv',
};

function main() {
    let data = {};

    let files = Object.keys(inputFiles).map(key => {
        let raw = fs.readFileSync(inputFiles[key], 'utf8');

        return new Promise((resolve, reject) => {
            parse(raw, {columns: true}, function(err, data) {
                if (err) {
                    reject();
                }

                resolve({ key, data });
            });
        });
    });

    return Promise.all(files).then(result => {
        result.forEach(r => {
            data[r.key] = r.data;
        });
    }).then(() => {
        return insertUsers(data.users);
    }).then(() => {
        return insertMembers(data.members);
    }).then(() => {
        return insertProductTypes(data.producttypes);
    }).then(() => {
        return insertProducts(data.products);
    }).then(() => {
        console.log('All is well in Middle-earth.');

        return Promise.resolve();
    }).catch(err => {
        console.log(err);
        return Promise.reject();
    });
}

function insertUsers(data) {
    console.log('INSERTING USERS');
    return db.task(tx => {
        let queries = data.map(d => {
            return tx.none(`
                INSERT INTO member (email, role, mongo_id)
                VALUES ($1, $2, $3)
            `, [d.email, d.role, d._id])
        });

        return tx.batch(queries);
    });
}

function insertMembers(data) {
    console.log('INSERTING MEMBERS');

    return db.any(`SELECT * FROM member_type`).then(mts => {
        let mappedMemberTypes = {};

        mts.forEach(mt => {
            mappedMemberTypes[mt.member_type] = mt.id;
        });

        data.forEach(d => {
            d.member_type_id = mappedMemberTypes[d.type] || mappedMemberTypes.working;
            d.yearOfBirth = parseInt(d.yearOfBirth) || null;
            d.gender = d.gender || 'other';
            d.createdAt = moment(d.createdAt).toDate();
            d.expirationDate = moment(d.expirationDate).toDate();
        });

        return db.any(`SELECT * FROM member`);
    }).then(members => {
        // REMOVE EXISTING MEMBERS AND UPDATE THEM INSTEAD
        let existingEmails = members.map(m => { return m.email; });

        let toCreate = data.filter(d => {
            return !existingEmails.includes(d.email);
        });

        let toUpdate = data.filter(d => {
            return existingEmails.includes(d.email);
        });

        return db.task(tx => {
            let queries = toUpdate.map(m => {
                return tx.none(`
                    UPDATE member
                    SET
                        name = $[name],
                        location = $[location],
                        education = $[education],
                        profession = $[profession],
                        member_type_id = $[member_type_id],
                        year_of_birth = $[yearOfBirth],
                        created_at = $[createdAt],
                        expiration_date = $[expirationDate],
                        mongo_id = $[_id]
                    WHERE email = $[email]
                `, m);
            });

            return tx.batch(queries);
        }).then(() => {
            return db.task(tx => {
                let queries = toCreate.map(m => {
                    return tx.none(`
                        INSERT INTO member (
                            name,
                            location,
                            education,
                            profession,
                            email,
                            member_type_id,
                            gender,
                            year_of_birth,
                            created_at,
                            expiration_date,
                            mongo_id
                        ) VALUES (
                            $[name],
                            $[location],
                            $[education],
                            $[profession],
                            $[email],
                            $[member_type_id],
                            $[gender],
                            $[yearOfBirth],
                            $[createdAt],
                            $[expirationDate],
                            $[_id]
                        )
                    `, m);
                });

                return tx.batch(queries);
            });
        });
    });
}

function insertProductTypes(data) {
    console.log('INSERTING PRODUCT TYPES');

    return db.task(tx => {
        let queries = data.map(d => {
            return tx.any(`
                INSERT INTO product_type (identifier, mongo_id)
                VALUES ($[identifier], $[_id])
            `, d);
        });

        return tx.batch(queries);
    });
}

function insertProducts(data) {
    console.log('INSERTING PRODUCTS');

    return db.any('SELECT * FROM product_type').then(pts => {
        let mongoPsqlMap = {};
        pts.forEach(pt => {
            mongoPsqlMap[pt.mongo_id] = pt.id;
        });

        data.forEach(d => {
            if (d.attribute) {
                d.attribute = JSON.parse(d.attribute.replace(/""/g, '"')
                    .replace(/^"/, '').replace(/"$/, ''));
            } else {
                d.attribute = null;
            }

            d.price = parseInt(d.price);
            d.createdAt = moment(d.createdAt).toDate();
            d.updatedAt = moment(d.createdAt).toDate();
            d.product_type_id = mongoPsqlMap[d.type];
        });

        return db.task(tx => {
            let queries = data.map(d => {
                return tx.any(`
                    INSERT INTO product (
                        product_type_id,
                        name,
                        price,
                        description,
                        attribute,
                        created_at,
                        updated_at
                    ) VALUES (
                        $[product_type_id],
                        $[name],
                        $[price],
                        $[description],
                        $[attribute],
                        $[createdAt],
                        $[updatedAt]
                    )
                `, d);
            });

            return tx.batch(queries);
        });
    });
}


db.task(tx => {
    console.log('ADDING mongo_id COLUMNS');
    let queries = [
        tx.any('alter table member add column if not exists mongo_id text'),
        tx.any('alter table product_type add column if not exists mongo_id text'),
        tx.any('alter table product add column if not exists mongo_id text'),
    ];

    return tx.batch(queries);
}).then(() => {
    return db.task(tx => {
        console.log('EMPTYING CONTENT');
        let queries = [
            tx.any('delete from member'),
            tx.any('delete from product_type'),
            tx.any('delete from product'),
        ];

        return tx.batch(queries);
    });
}).then(() => {
    return main();
}).then(() => {
    return db.task(tx => {
        console.log('DROPPING mongo_id COLUMNS');
        let queries = [
            tx.any('alter table member drop column mongo_id'),
            tx.any('alter table product_type drop column mongo_id'),
            tx.any('alter table product drop column mongo_id'),
        ];

        return tx.batch(queries);
    });
}).then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(2);
});

