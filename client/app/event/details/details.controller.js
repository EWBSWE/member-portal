'use strict';

angular.module('ewbMemberApp')
  .controller('EventDetailsCtrl', function ($scope, $http, $routeParams) {
    $scope.event = {};

    $http.get('/api/events/' + $routeParams.id).success(function(event) {
      $scope.event = member;
    });

  });
