'use strict';

angular.module('ewbMemberApp')
  .controller('MemberDetailCtrl', function ($scope, $http, $routeParams) {
    $scope.member = {};
    $scope.payments = [];

    $http.get('/api/members/' + $routeParams.id).success(function(member) {
      $scope.member = member;
    });

    $http.get('/api/members/' + $routeParams.id + '/payments').success(function(payments) {
      $scope.payments = payments;
    });

    $scope.memberTypeText = function() {
      var text = 'Medlem som yrkesverksam/senior';
      if ($scope.member.student) {
        text = 'Studentmedlem';
      }
      return text;
    };

    $scope.isExpired = function() {
      return moment() > moment($scope.member.expirationDate);
    };
  });
