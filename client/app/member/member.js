'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/member/membership/membership.html',
        controller: 'MembershipCtrl'
      })
      .when('/renew', {
        templateUrl: 'app/member/membership/membership.html',
        controller: 'MembershipCtrl'
      })
      .when('/fornya-medlemskap', {
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
        templateUrl: 'app/member/edit/edit.html',
        controller: 'MemberEditCtrl',
        authenticate: true, 
      })
      .when('/member/:id/edit', {
        templateUrl: 'app/member/edit/edit.html',
        controller: 'MemberEditCtrl',
        authenticate: true, 
      })
      .when('/member/:id', {
        templateUrl: 'app/member/details/details.html',
        controller: 'MemberDetailsCtrl',
        authenticate: true, 
      });
  });
