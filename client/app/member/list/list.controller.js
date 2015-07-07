'use strict';

angular.module('ewbMemberApp')
  .controller('MemberListCtrl', function ($scope, $http) {
    $scope.members= [];

    $http.get('/api/members').success(function(members) {
      $scope.members = members;
    });
  });
