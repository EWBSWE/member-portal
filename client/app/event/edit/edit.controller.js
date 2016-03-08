'use strict';

angular.module('ewbMemberApp')
.controller('EventEditCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = { addons: [{}] };

    $scope.showError = false;
    $scope.eventErrors = {};

    $scope.showSuccess = false;
    $scope.editEvent = $routeParams.id;

    if ($routeParams.id) {
        $http.get('/api/events/' + $routeParams.id).success(function(ev) {
            _.each(ev.addons, function(a) {
                a.name = a.product.name;
                a.price = a.product.price;
            });
            
            $scope.ev = ev;
            $scope.ev.dueDate = moment($scope.ev.dueDate).format('YYYY-MM-DD');
        });
    }

    var addEvent = function() {
        $http.post('/api/events', {
            identifier: $scope.ev.identifier,
            name: $scope.ev.name,
            description: $scope.ev.description,
            active: $scope.ev.active,
            dueDate: $scope.ev.dueDate,
            contact: $scope.ev.contact,
            addons: $scope.ev.addons,
            confirmationEmail: $scope.ev.confirmationEmail,
        }).success(function(data, status) {
            $scope.showSuccess = true;
            $scope.showError = false;
        }).error(function(data, status) {
            $scope.showError = true;
            $scope.showSuccess = false;
            $scope.eventErrors = data;
        });
    };

    var updateEvent = function() {
        console.log($scope.ev);
        $http.put('/api/events/' + $scope.ev._id, {
            identifier: $scope.ev.identifier,
            name: $scope.ev.name,
            description: $scope.ev.description,
            active: $scope.ev.active,
            dueDate: $scope.ev.dueDate,
            contact: $scope.ev.contact,
            addons: $scope.ev.addons,
            confirmationEmail: $scope.ev.confirmationEmail,
        }).success(function(data, status) {
            $scope.showSuccess = true;
            $scope.showError = false;
        }).error(function(data, status) {
            $scope.showError = true;
            $scope.showSuccess = false;
            $scope.eventErrors = data;
        });
    };

    $scope.updateAddon = function(addon) {
        $http.put('/api/events/' + $scope.ev._id + '/addon/' + addon._id, {
            name: addon.name,
            price: addon.price,
            capacity: addon.capacity,
        }).success(function(data, status) {
            addon.error = false;
        }).error(function(data, status) {
            addon.error = true;
        })
    };

    $scope.submit = function() {
        if ($scope.eventform.invalid) {
            return;
        }

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
            $scope.debugEventParticipant = "";
        });
    };

    $scope.increaseAddons = function() {
        $scope.ev.addons.push({});
    };

    $scope.decreaseAddons = function() {
        if ($scope.ev.addons.length > 1) {
            $scope.ev.addons.pop();
        }
    };
});
