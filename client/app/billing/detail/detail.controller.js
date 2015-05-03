'use strict';

angular.module('ewbMemberApp')
  .controller('BillingDetailCtrl', function ($scope, $http, $routeParams) {
    $scope.billing = null;

    $http.get('/api/billings/' + $routeParams.id).success(function(billing) {
      $scope.billing = billing;
    });
  });
