process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));

var Product = require(path.join(__dirname, '../server/models/product.model'));
var ProductType = require(path.join(__dirname, '../server/models/product-type.model'));

mongoose.connect(config.mongo.uri, config.mongo.options);

ProductType.create([{
    identifier: 'Membership',
}, {
    identifier: 'Event',
}], function(err, types) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(types);
    Product.create([{
        name: 'Medlemskap 1 år student',
        type: types[0]._id,
        typeAttributes: {
            memberType: 'student',
            durationDays: 365,
        },
        price: 40,
    }, {
        name: 'Medlemskap 3 år student',
        type: types[0]._id,
        typeAttributes: {
            memberType: 'student',
            durationDays: 365 * 3,
        },
        price: 90,
    }, {
        name: 'Medlemskap 1 år yrkesverksam',
        type: types[0]._id,
        typeAttributes: {
            memberType: 'working',
            durationDays: 365,
        },
        price: 100,
    }, {
        name: 'Medlemskap 3 år yrkesverksam',
        type: types[0]._id,
        typeAttributes: {
            memberType: 'working',
            durationDays: 365 * 3,
        },
        price: 250,
    }, {
        name: 'Medlemskap 1 år senior',
        type: types[0]._id,
        typeAttributes: {
            memberType: 'senior',
            durationDays: 365,
        },
        price: 100,
    }, {
        name: 'Medlemskap 3 år senior',
        type: types[0]._id,
        typeAttributes: {
            memberType: 'senior',
            durationDays: 365 * 3,
        },
        price: 250,
    }], function(err, products) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        console.log(products);
        process.exit(0);
    });
});
