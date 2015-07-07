'use strict';

angular.module('ewbMemberApp')
  .controller('MemberDetailCtrl', function ($scope, $http, $routeParams) {
    $scope.member = null;
    $scope.payments = [];

    $http.get('/api/members/' + $routeParams.id).success(function(member) {
      $scope.member = member;
    });

    $http.get('/api/members/' + $routeParams.id + '/payments').success(function(payments) {
      $scope.payments = payments;
    });
  });
