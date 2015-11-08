'use strict';

angular.module('ewbMemberApp')
  .controller('ResetCtrl', function ($scope, $location, $http) {
    $scope.reset = function (form) {
      if (form.$valid && $location.search().token) {
        $http.post('/api/users/reset-password-token', { 
          newPassword: $scope.password,
          token: $location.search().token,
        }).success(function (data) {
          $location.path('/');
        });
      }
    };
  });
