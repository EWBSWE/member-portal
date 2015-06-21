'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/kvitto', {
        templateUrl: 'app/receipt/receipt.html',
        controller: 'ReceiptCtrl'
      });
  });
