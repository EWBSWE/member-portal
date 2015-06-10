'use strict';

angular.module('ewbMemberApp')
  .controller('FooCtrl', function ($scope, $http) {
    $scope.membership = {};

    $scope.initiatePayment = function() {
      // todo check valid membership details in a more centralized way instead
      // of in the frontend
      // maybe create membership model?
      if ($scope.membership.email === '') {
        return;
      }
      if ($scope.membership.isStudent !== '0' || $scope.membership.isStudent !== '1') {
        return;
      }
      if ($scope.membership.subscriptionLength !== '1' || $scope.membership.subscriptionLength !== '3') {
        return;
      }
      $http.post('/api/payment', {
        email: $scope.membership.email,
        isStudent: $scope.membership.isStudent === '1',
        subscriptionLength: $scope.membership.subscriptionLength,
      });
    };
  });
