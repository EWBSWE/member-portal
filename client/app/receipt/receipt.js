'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/receipt', {
        templateUrl: 'app/receipt/receipt.html',
        controller: 'ReceiptCtrl'
      });
  });
