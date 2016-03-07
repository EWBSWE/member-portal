'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/settings', {
        templateUrl: 'app/setting/list/list.html',
        controller: 'SettingListCtrl',
        authenticate: true, 
      });
  });
