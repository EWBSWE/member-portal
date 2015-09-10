'use strict';
/* globals alert*/

angular.module('ewbMemberApp')
  .controller('MemberBulkCtrl', function ($scope, $http) {
    $scope.addMembers = function() {
        console.log($scope.csv);
      if ($scope.csv === '' || $scope.csv === undefined) {
        return;
      }

      $http.post('/api/members/bulk', {
        csv: $scope.csv
      }).success(function(data, status) {
          $scope.validMembers = data.valid;
          $scope.updatedMembers = data.updated;
          $scope.invalidMembers = data.invalid;
      }).error(function(data, status) {
        alert('Internal error, please try again or contact admin if problem persists.');
      });
    };
  });
