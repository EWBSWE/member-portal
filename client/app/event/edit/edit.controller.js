'use strict';

angular.module('ewbMemberApp')
.controller('EventEditCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = { addons: [{}] };

    $scope.showError = false;
    $scope.eventErrors = {};

    $scope.showSuccess = false;
    $scope.editEvent = $routeParams.id;

    $scope.ev = {
        identifier: 'identifier',
        name: 'name',
        description: 'description',
        active: false,
        dueDate: '2019-01-01',
        contact: 'admin@admin.se',
        addons: [{
            name: 'name',
            price: 1111,
            description: 'description',
            capacity: 111
        }],
        notificationOpen: false,
        confirmationEmail: {
            subject: 'subject',
            body: 'body'
        },
    };

    if ($routeParams.id) {
        $http.get('/api/events/' + $routeParams.id).success(function(ev) {
            _.each(ev.addons, function(a) {
                a.name = a.product.name;
                a.price = a.product.price;
                a.description = a.product.description;
            });
            
            $scope.ev = ev;
            $scope.ev.dueDate = moment($scope.ev.dueDate).format('YYYY-MM-DD');
        });
    }

    var addEvent = function(data) {
        $http.post('/api/events', data).success(function(data, status) {
            $scope.showSuccess = true;
            $scope.showError = false;
        }).error(function(data, status) {
            $scope.showError = true;
            $scope.showSuccess = false;
            $scope.eventErrors = data;
        });
    };

    var updateEvent = function(data) {
        $http.put('/api/events/' + $scope.ev._id, data).success(function(data, status) {
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

        var data = {
            identifier: $scope.ev.identifier,
            name: $scope.ev.name,
            description: $scope.ev.description,
            active: $scope.ev.active,
            dueDate: $scope.ev.dueDate,
            contact: $scope.ev.contact,
            addons: $scope.ev.addons,
            emailTemplate: $scope.ev.confirmationEmail,
            notificationOpen: $scope.ev.notificationOpen,
            subscribers: $scope.ev.subscribers,
        };

        // Make sure addons has data
        var addonsValid = true;
        for (var i = 0; i < data.addons.length; i++) {
            var addon = data.addons[i];
            addonsValid = addon.name != undefined && addon.name.length > 0 && addon.price >= 0 && addon.capacity >= 0;
        }

        if (!addonsValid) {
            return;
        }

        if ($scope.editEvent) {
            updateEvent(data);
        } else {
            addEvent(data);
        }
    };

    $scope.submitAddon = function() {
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
