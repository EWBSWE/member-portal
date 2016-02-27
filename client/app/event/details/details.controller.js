'use strict';

angular.module('ewbMemberApp')
  .controller('EventDetailsCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = {};

    $http.get('/api/events/' + $routeParams.id).success(function(ev) {
      $scope.ev = ev;
    });

  });
