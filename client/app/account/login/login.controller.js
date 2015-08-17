'use strict';

angular.module('ewbMemberApp')
  .controller('LoginCtrl', function ($scope, Auth, $location) {
    $scope.user = {};
    $scope.errors = {};

    var landingPage = '/admin';

    if (Auth.isLoggedIn()) {
      $location.path(landingPage);
    }

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          $location.path(landingPage);
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

  });
