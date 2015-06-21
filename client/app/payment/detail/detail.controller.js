'use strict';

angular.module('ewbMemberApp')
  .controller('PaymentDetailCtrl', function ($scope, $http, $routeParams) {
    $scope.payment = null;

    $http.get('/api/payments/' + $routeParams.id).success(function(payment) {
      console.log(payment);
      $scope.payment = payment;
    });
  });
