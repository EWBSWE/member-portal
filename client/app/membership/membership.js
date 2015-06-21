'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/bli-medlem', {
        templateUrl: 'app/membership/membership.html',
        controller: 'MembershipCtrl'
      });
  });
