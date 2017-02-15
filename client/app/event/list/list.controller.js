'use strict';
/* globals confirm*/

angular.module('ewbMemberApp').controller('EventListCtrl', function ($scope, $http) {
    $scope.events = [];

    $http.get('/api/events').success(function(events) {
        $scope.events = events;
    });

    $scope.deleteEvent = function(id) {
        if (confirm('Are you sure you want to remove event? This action cannot be undone.')) {
            $http.delete('/api/events/' + id).success(function(result) {
                $http.get('/api/events').success(function(events) {
                    $scope.events = events;
                });
            });
        }
    };
});
