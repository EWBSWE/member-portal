'use strict';

var fs = require('fs');
var path = require('path');

module.exports = {
    sender: function() {
        // Should perhaps be set from a config file instead of directly in the
        // code like this.
        return 'volontar@ingenjorerutangranser.se';
    },
    getSubject: function(name) {
        return getContent(name + '-subject.txt');
    },
    getBody: function(name) {
        return getContent(name + '.txt');
    },
};

var getContent = function(filename) {
    return fs.readFileSync(path.join(__dirname, filename), 'utf8');
};
