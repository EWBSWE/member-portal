'use strict';

var fs = require('fs');
var path = require('path');

module.exports = {
    noreply: function() {
        return 'noreply@ingenjorerutangranser.se';
    },
    sender: function() {
        // Should perhaps be set from a config file instead of directly in the
        // code like this.
        return 'Ingenjörer utan gränser <volontar@ingenjorerutangranser.se>';
    },
    getSubject: function(name) {
        return getContent(name + '-subject.txt');
    },
    getBody: function(name, params) {
        var content = getContent(name + '.txt');

        if (params) {
            for (var i = 0; i < Object.keys(params).length; i++) {
                var key = Object.keys(params)[i];
                var value = params[key];
                var r = new RegExp('{' + key + '}', 'g');
                content = content.replace(r, value);
            }
        }

        return content;
    },
};

var getContent = function(filename) {
    return fs.readFileSync(path.join(__dirname, filename), 'utf8');
};
