'use strict';

angular.module('ewbMemberApp')
  .controller('MemberNewCtrl', function ($scope, $http, moment) {
    $scope.newMember = {};

    $scope.addMember = function() {
      $scope.successMessages = {};

      if (!$scope.newMember.email) {
        return;
      } else if (!$scope.newMember.student) {
        return;
      } else if (!$scope.newMember.expirationDate && !$scope.newMember.subscriptionLength) {
        return;
      }

      var expirationDate = null;
      if ($scope.newMember.expirationDate) {
        expirationDate = moment($scope.newMember.expirationDate);
      } else if ($scope.newMember.subscriptionLength === '1') {
        expirationDate = moment().add(1, 'year');
      } else if ($scope.newMember.subscriptionLength === '3') {
        expirationDate = moment().add(3, 'year');
      }

      $http.post('/api/members', {
        email: $scope.newMember.email, 
        student: $scope.newMember.student,
        expirationDate: expirationDate.format(),
      }).success(function(data, status) {
        $scope.successMessages = { memberCreated: true };
      }).error(function(data, status) {
        $scope.newMember.$error = { emailExists: true };
      });

      $scope.newMember = {};
    };
  });
