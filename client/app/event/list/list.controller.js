'use strict';
/* globals confirm*/

angular.module('ewbMemberApp')
  .controller('EventListCtrl', function ($scope, $http) {
    $scope.events = [];

    $http.get('/api/events').success(function(events) {
      $scope.events = events;
    });

  });
