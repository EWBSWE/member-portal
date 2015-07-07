'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/bli-medlem', {
        templateUrl: 'app/member/new/membership.html',
        controller: 'MembershipCtrl'
      })
      .when('/members', {
        templateUrl: 'app/member/list/list.html',
        controller: 'MemberListCtrl'
      });
  });
