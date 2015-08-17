'use strict';

angular.module('ewbMemberApp')
  .controller('PaymentDetailCtrl', function ($scope, $http, $routeParams) {
    $scope.payment = {};

    $http.get('/api/payments/' + $routeParams.id).success(function(payment) {
      $scope.payment = payment;
    });
  });
