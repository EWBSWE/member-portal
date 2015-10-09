'use strict';

angular.module('ewbMemberApp')
  .controller('EWBErrorCtrl', function ($scope, $http, Auth, User) {
    $scope.ewbErrors = [];

    $http.get('/api/errors').success(function(data) {
      console.log(data);
      $scope.ewbErrors = data;
    });
  });
