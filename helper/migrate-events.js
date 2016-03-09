process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var _ = require('lodash');

var config = require(path.join(__dirname, '../server/config/environment'));

var Buyer = require(path.join(__dirname, '../server/models/buyer.model'));
var Member = require(path.join(__dirname, '../server/models/member.model'));
var Payment = require(path.join(__dirname, '../server/models/payment.model'));
var Product = require(path.join(__dirname, '../server/models/product.model'));
var ProductType = require(path.join(__dirname, '../server/models/product-type.model'));

mongoose.connect(config.mongo.uri, config.mongo.options);

ProductType.findOne({ identifier: 'Membership' }, function(err, type) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    Product.find({ type: type._id }, function(err, products) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        Payment.find({
            member: {
                $exists: true
            }
        }).populate({
            path: 'member',
            model: 'Member',
        }).exec(function(err, payments) {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            rec(0, payments, products);
        });
        
    });
});

function rec(index, stack, products) {
    if (index < stack.length) {
        var payment = stack[index];

        if (payment.get('member')) {
            Buyer.create({ type: 'Member', document: payment.get('member')._id }, function(err, buyer) {
                if (err) {
                    console.log(err);
                    process.exit(2);
                }

                var membershipProduct = _.filter(products, function(p) {
                    return payment.amount === p.price;
                })[0];

                payment.buyer = buyer._id;
                payment.products = [ membershipProduct ];
                payment.save(function(err, updatedPayment) {
                    if (err) {
                        console.log(err);
                        process.exit(2);
                    }


                    rec(index + 1, stack, products);
                });
            });
        } else {
            rec(index + 1, stack, products);
        }
    } else {
        console.log('All done');
        process.exit(0);
    }
};
