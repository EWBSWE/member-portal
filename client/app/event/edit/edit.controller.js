'use strict';

angular.module('ewbMemberApp')
.controller('EventEditCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = {};
    $scope.showError = false;
    $scope.showSuccess = false;
    $scope.editEvent = $routeParams.id;

    if ($routeParams.id) {
        $http.get('/api/events/' + $routeParams.id).success(function(ev) {
            $scope.ev = ev;
        });
    } else if ($routeParams.test) {
        $scope.ev = {
            name: 'Event Foo',
            description: 'Lorem Ipsum',
            price: 50,
            active: true,
            maxParticipants: 70,
            dueDate: '2016-08-11',
            contact: 'test@example.com',
        };
    }

    console.log($routeParams);

    var addEvent = function() {
        $http.post('/api/events', {
            name: $scope.ev.name,
            description: $scope.ev.description,
            price: $scope.ev.price,
            active: $scope.ev.active,
            maxParticipants: $scope.ev.maxParticipants,
            dueDate: $scope.ev.dueDate,
            contact: $scope.ev.contact,
        }).success(function(data, status) {
            $scope.showSuccess = true;
            $scope.ev = {};
        }).error(function(data, status) {
            $scope.showError = true;
        });
    };

    var updateEvent = function() {
        $http.put('/api/events/' + $scope.ev._id, {
            name: $scope.ev.name,
            description: $scope.ev.description,
            price: $scope.ev.price,
            active: $scope.ev.active,
            maxParticipants: $scope.ev.maxParticipants,
            dueDate: $scope.ev.dueDate,
            contact: $scope.ev.contact,
        }).success(function(data, status) {
            $scope.showSuccess = true;
        }).error(function(data, status) {
            $scope.showError = true;
        });
    };

    $scope.submit = function() {
        if ($scope.editEvent) {
            updateEvent();
        } else {
            addEvent();
        }
    };

    $scope.addEventParticipant = function () {
        $http.post('/api/events/' + $scope.ev._id + '/add-participant', {
            email: $scope.debugEventParticipant,
        }).success(function(data, status) {
            console.log(data, status);
            $scope.debugEventParticipant = "";
        });
    };
});
