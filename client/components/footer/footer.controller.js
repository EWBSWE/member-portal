'use strict';

angular.module('ewbMemberApp')
  .controller('FooterCtrl', function ($scope, $location) {
    $scope.year = moment();
  });
