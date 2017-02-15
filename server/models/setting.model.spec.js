'use strict';

var expect = require('chai').expect;

var db = require('../db').db;

var Setting = require('./setting.model');

describe('Setting model', function() {
    beforeEach(function(done) {
        db.any(`
            INSERT INTO setting (key, value, description)
            VALUES ($1, $2, $3), ($4, $5, $6)
        `, [
            'somekey', '14', 'some description',
            'otherkey', 'othervalue', null
        ]).then(() => {
            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM setting').then(() => {
            done();
        });
    });

    describe('Read', function() {
        it('should find a setting', function(done) {
            Setting.findBy({ key: 'somekey'}).then(ss => {
                expect(ss.length).to.equal(1);
                done();
            });
        });

        it('should find settings', function(done) {
            Setting.findBy({ key: ['somekey', 'otherkey']}).then(ss => {
                expect(ss.length).to.equal(2);
                done();
            });
        });
    });
});
