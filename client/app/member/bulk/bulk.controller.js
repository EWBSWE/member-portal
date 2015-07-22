'use strict';

angular.module('ewbMemberApp')
  .controller('MemberBulkCtrl', function ($scope, $http) {

    $scope.addMembers = function() {
      if ($scope.csv === '') {
        return;
      }

      $http.post('/api/members/bulk', {
        csv: $scope.csv,
      }).success(function(data, status) {
        console.log('successfully added');
      }).error(function(data, status) {
        console.log('failed to add a single member');
      });
    };
  });
