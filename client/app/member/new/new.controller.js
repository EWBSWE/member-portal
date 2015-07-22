'use strict';

angular.module('ewbMemberApp')
  .controller('MemberNewCtrl', function ($scope, $http, moment) {
    $scope.newMember = {};
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.addMember = function() {
      $scope.successMessages = {};

      if (!$scope.newMember.name) {
        return;
      } else if (!$scope.newMember.location) {
        return;
      } else if (!$scope.newMember.profession) {
        return;
      } else if (!$scope.newMember.email) {
        return;
      } else if (!$scope.newMember.telephone) {
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
        name: $scope.newMember.name,
        location: $scope.newMember.location,
        profession: $scope.newMember.profession,
        telephone: $scope.newMember.telephone,
        email: $scope.newMember.email, 
        student: $scope.newMember.student,
        expirationDate: expirationDate.format(),
      }).success(function(data, status) {
        $scope.showSuccess = true;
      }).error(function(data, status) {
        $scope.showError = true;
      });

      $scope.newMember = {};
    };
  });
