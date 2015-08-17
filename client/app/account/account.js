'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl'
      })
      .when('/settings', {
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      });
  });
