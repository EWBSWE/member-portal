'use strict';

angular.module('ewbMemberApp')
  .controller('HeaderCtrl', function ($scope, $location) {
    $scope.navbarPath = 'components/navbar/navbar.html';
    if (/bli-medlem/.test($location.path()) || /kvitto/.test($location.path())) {
      $scope.navbarPath = 'components/public-navbar/public-navbar.html';
    }
  });
