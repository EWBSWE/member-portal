'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/bli-medlem', {
        templateUrl: 'app/member/membership/membership.html',
        controller: 'MembershipCtrl'
      })
      .when('/members', {
        templateUrl: 'app/member/list/list.html',
        controller: 'MemberListCtrl',
        authenticate: true, 
      })
      .when('/member/bulk', {
        templateUrl: 'app/member/bulk/bulk.html',
        controller: 'MemberBulkCtrl',
        authenticate: true, 
      })
      .when('/member/new', {
        templateUrl: 'app/member/new/new.html',
        controller: 'MemberNewCtrl',
        authenticate: true, 
      })
      .when('/member/:id', {
        templateUrl: 'app/member/detail/detail.html',
        controller: 'MemberDetailCtrl',
        authenticate: true, 
      });
  });
