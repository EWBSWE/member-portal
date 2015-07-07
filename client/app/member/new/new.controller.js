'use strict';

angular.module('ewbMemberApp')
  .controller('MemberNewCtrl', function ($scope, $http, $routeParams) {
    $scope.newMember = null;

    $scope.addMember = function() {
      if ($scope.newMember === '') {
        return;
      }

      $http.post('/api/members', {
        email: newMember.email, 
        student: newMember.student,
      });
      $scope.newMember = {};
    };
  });
