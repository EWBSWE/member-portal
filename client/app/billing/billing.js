'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    console.log('router provider billing');
    $routeProvider
      .when('/billing', {
        templateUrl: 'app/billing/billing.html',
        controller: 'BillingCtrl'
      });
  });
