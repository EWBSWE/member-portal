'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/payments', {
        templateUrl: 'app/payment/list/list.html',
        controller: 'PaymentListCtrl',
        authenticate: true, 
      })
      .when('/payment/:id', {
        templateUrl: 'app/payment/detail/detail.html',
        controller: 'PaymentDetailCtrl',
        authenticate: true, 
      });
  });
