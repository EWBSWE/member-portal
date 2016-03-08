'use strict';

angular.module('ewbMemberApp')
.controller('EventDetailsCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = {};

    $http.get('/api/events/' + $routeParams.id).success(function(ev) {
        $scope.ev = ev;
        $scope.separatedParticipants = _.map(ev.participants, 'email').join(',');
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
});
