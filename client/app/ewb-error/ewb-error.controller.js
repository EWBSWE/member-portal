'use strict';

angular.module('ewbMemberApp')
  .controller('EWBErrorCtrl', function ($scope, $http, Auth, User) {
    $scope.ewbErrors = [];
    $scope.sortBy = 'createdAt';
    $scope.sortReverse = false;

    $http.get('/api/errors').success(function(data) {
      console.log(data);
      $scope.ewbErrors = data;
    });
  });
