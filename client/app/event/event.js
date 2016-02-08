'use strict';

angular.module('ewbMemberApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/events', {
        templateUrl: 'app/event/list/list.html',
        controller: 'EventListCtrl',
        authenticate: true, 
      })
      .when('/event/new', {
        templateUrl: 'app/event/edit/edit.html',
        controller: 'EventEditCtrl',
        authenticate: true, 
      })
      .when('/event/:id/edit', {
        templateUrl: 'app/event/edit/edit.html',
        controller: 'EventEditCtrl',
        authenticate: true, 
      })
      .when('/event/:id', {
        templateUrl: 'app/event/details/details.html',
        controller: 'EventDetailsCtrl',
        authenticate: true, 
      });
  });
