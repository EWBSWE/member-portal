'use strict';

angular.module('ewbMemberApp')
  .controller('ReceiptCtrl', function ($scope, $http, $location) {
    $scope.receipt = {};

    $http.get('/api/payments/' + $location.search().id).success(function(data, status) {
      $scope.receipt = data;
    }).error(function(data, status) {
      console.log('misslyckades med att hamta kvitto');
    });
  });
