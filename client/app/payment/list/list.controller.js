"use strict";

angular
  .module("ewbMemberApp")
  .controller("PaymentListCtrl", function ($scope, $http) {
    $scope.payments = [];

    $http.get("/api/payments").success(function (payments) {
      $scope.payments = payments;
    });
  });
