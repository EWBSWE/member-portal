'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/membership', {
        templateUrl: 'app/membership/membership.html',
        controller: 'MembershipCtrl'
      });
  });
