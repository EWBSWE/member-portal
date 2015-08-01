'use strict';

angular.module('ewbMemberApp')
  .controller('ReceiptCtrl', function ($scope, $http, $location) {
    $scope.receipt = {};
    $scope.member = {};

    $http.get('/api/payments/' + $location.search().id).success(function(receipt, status) {
      $scope.receipt = receipt;
      $http.get('/api/members/' + receipt.member).success(function(member, status) {
        $scope.member = member;
      }).error(function(data, status) {
        console.log('Misslyckades med att hamta medlem');
      });
    }).error(function(data, status) {
      console.log('Misslyckades med att hamta kvitto');
    });

    $scope.memberTypeText = function() {
      var text = 'Medlem som yrkesverksam/senior';
      if ($scope.member.student) {
        text = 'Studentmedlem';
      }
      return text;
    };
  });
