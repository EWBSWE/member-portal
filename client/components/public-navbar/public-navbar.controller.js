'use strict';

angular.module('ewbMemberApp')
  .controller('PublicNavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'Hem',
      'link': '/start'
    }, {
      'title': 'Blogg',
      'link': '/content/bloggen'
    }, {
      'title': 'Projekt',
      'link': '/content/projekt'
    }, {
      'title': 'Engagera dig',
      'link': 'http://volontar.ingenjorerutangranser.se'
    }, {
      'title': 'Om oss',
      'link': '/content/syfte-och-arbetsgrupper'
    }, {
      'title': 'Partners',
      'link': '/partners-1'
    }];

    $scope.isCollapsed = true;
  });
