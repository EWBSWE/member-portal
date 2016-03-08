'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/login', {
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl'
      })
      .when('/account', {
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .when('/reset-password', {
        templateUrl: 'app/account/reset/reset.html',
        controller: 'ResetCtrl',
      });
  });
