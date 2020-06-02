"use strict";

angular
  .module("ewbMemberApp")
  .controller("MemberDetailsCtrl", function ($scope, $http, $routeParams) {
    $scope.member = {};
    $scope.payments = [];

    $http.get("/api/members/" + $routeParams.id).success(function (member) {
      $scope.member = member;
    });

    $scope.isExpired = function () {
      return moment() > moment($scope.member.expirationDate);
    };
  });
