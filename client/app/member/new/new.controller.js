'use strict';

angular.module('ewbMemberApp')
  .controller('MemberNewCtrl', function ($scope, $http) {
    $scope.newMember = null;

    $scope.addMember = function() {
        console.log($scope.newMember);
      if ($scope.newMember === '') {
        return;
      }

      $http.post('/api/members', {
        email: $scope.newMember.email, 
        student: $scope.newMember.student,
      });

      $scope.newMember = {};
    };
  });
