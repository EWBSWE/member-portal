'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/billing', {
        templateUrl: 'app/billing/list/list.html',
        controller: 'BillingListCtrl'
      })
      .when('/billing/:id', {
        templateUrl: 'app/billing/detail/detail.html',
        controller: 'BillingDetailCtrl'
      });
  });
