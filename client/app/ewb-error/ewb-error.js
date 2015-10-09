'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/errors', {
        templateUrl: 'app/ewb-error/ewb-error.html',
        controller: 'EWBErrorCtrl'
      });
  });
