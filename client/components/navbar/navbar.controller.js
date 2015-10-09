'use strict';

angular.module('ewbMemberApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [];

    if (Auth.isLoggedIn()) {
      $scope.menu.push({
        title: 'Payments',
        link: '/payments',
      }, {
        title: 'Members',
        link: '/members',
      });
    }

    if (Auth.isAdmin()) {
      $scope.menu.push({
        title: 'Errors',
        link: '/errors',
      }, {
        title: 'Admin',
        link: '/admin',
      });
    }

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
