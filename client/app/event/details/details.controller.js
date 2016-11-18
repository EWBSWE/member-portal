'use strict';

angular.module('ewbMemberApp')
.controller('EventDetailsCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = {};

    $http.get('/api/events/' + $routeParams.id).success(function(ev) {
        $scope.ev = ev;
        $scope.separatedParticipants = _.map(ev.participants, 'email').join(',');
        $scope.subscribers = _.map(ev.subscribers, 'email').join(',');
    });

    var separateWith = function(sep) {
        $scope.separatedParticipants = _.map($scope.ev.participants, 'email').join(sep);
    };

    $scope.commaSep = function() {
        separateWith(',');
    };

    $scope.lineSep = function() {
        separateWith('\n');
    };

    $scope.joinProducts = function(products) {
        var matchingAddons = _.filter($scope.ev.addons, function(addon) {
            return _.include(products, addon.id);
        });

        return _.map(matchingAddons, function(a) {
            return a.name;
        }).join(', ');
    };
});
