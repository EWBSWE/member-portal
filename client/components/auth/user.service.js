'use strict';

angular.module('ewbMemberApp')
  .factory('User', function ($resource) {
    return $resource('/api/members/:id/:controller', {
      id: '@_id'
    },
    {
      changePassword: {
        method: 'PUT',
        params: {
          controller:'password'
        }
      },
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      }
	  });
  });
