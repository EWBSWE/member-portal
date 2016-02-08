'use strict';

angular.module('ewbMemberApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [
      {
        title: 'Payments',
        link: '/payments',
      }, {
        title: 'Members',
        link: '/members',
      }, {
        title: 'Errors',
        link: '/errors',
      }, {
        title: 'Admin',
        link: '/admin',
      }, {
        title: 'Statistics',
        link: '/statistics'
      }
    ];

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
