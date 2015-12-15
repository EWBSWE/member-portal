'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/statistics', {
        templateUrl: 'app/statistics/statistics.html',
        controller: 'StatisticsCtrl'
      });
  });
