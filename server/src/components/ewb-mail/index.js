'use strict';

module.exports = {
    noreply: function() {
        return 'noreply@ewb-swe.org';
    },
    sender: function() {
        // Should perhaps be set from a config file instead of directly in the
        // code like this.
        return 'Ingenjörer utan gränser <info@ewb-swe.org>';
    }
};
