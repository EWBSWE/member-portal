'use strict';

angular.module('ewbMemberApp')
  .controller('MemberBulkCtrl', function ($scope, $http) {
    $scope.showValidMembers = false;
    $scope.showInvalidMembers = false;

    $scope.addMembers = function() {
      if ($scope.csv === '') {
        return;
      }

      $http.post('/api/members/bulk', {
        csv: $scope.csv,
      }).success(function(data, status) {
        if (data.valid.length) {
          $scope.validMembers = data.valid;
          $scope.showValidMembers = true;
        } else {
          $scope.showValidMembers = false;
        }

        if (data.invalid.length) {
          $scope.invalidMembers = data.invalid;
          $scope.showInvalidMembers = true;
        } else {
          $scope.showInvalidMembers = false;
        }

        $scope.noMembersAdded = data.valid.length === 0 && data.invalid.length === 0;
      }).error(function(data, status) {
        alert('Internal error, please try again or contact admin if problem persists.');
      });
    };
  });
