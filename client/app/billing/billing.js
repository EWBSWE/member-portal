'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/billing', {
        templateUrl: 'app/billing/billing.html',
        controller: 'BillingCtrl'
      });
  });
