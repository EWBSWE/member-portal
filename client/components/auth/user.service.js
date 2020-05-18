'use strict';

angular.module('ewbMemberApp').factory('User', function ($resource) {
    return $resource('/api/users/:id/:controller', { id: '@_id' }, {
        changePassword: {
            method: 'PUT',
        },
        get: {
            method: 'GET',
            params: {
                id:'me'
            }
        }
    });
});
