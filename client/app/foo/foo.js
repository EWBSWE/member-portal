'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/foo', {
        templateUrl: 'app/foo/foo.html',
        controller: 'FooCtrl'
      });
  });
