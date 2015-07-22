'use strict';

angular.module('ewbMemberApp')
  .controller('MemberListCtrl', function ($scope, $http) {
    $scope.members = [];

    $http.get('/api/members').success(function(members) {
      $scope.members = members;
    });

    $scope.deleteUser = function(id) {
      if (confirm('Are you sure you want to remove user? This action cannot be undone.')) {
        $http.delete('/api/members/' + id).success(function(member) {
          $http.get('/api/members').success(function(members) {
            $scope.members = members;
          });
        });
      }
    };
  });
