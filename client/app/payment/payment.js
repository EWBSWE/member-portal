'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/payments', {
        templateUrl: 'app/payment/list/list.html',
        controller: 'PaymentListCtrl'
      })
      .when('/payments/:id', {
        templateUrl: 'app/payment/detail/detail.html',
        controller: 'PaymentDetailCtrl'
      });
  });
