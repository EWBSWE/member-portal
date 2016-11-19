'use strict';

angular.module('ewbMemberApp')
.controller('EventEditCtrl', function ($scope, $http, $routeParams) {
    $scope.ev = { addons: [{}] };

    $scope.showError = false;
    $scope.eventErrors = {};

    $scope.showSuccess = false;
    $scope.editEvent = $routeParams.id;

    if (!$scope.editEvent) {
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
    }

    if ($routeParams.id) {
        $http.get('/api/events/' + $routeParams.id).success(function(ev) {
            _.each(ev.addons, function(a) {
                a.price = +a.price;
            });

            ev.subscribers = _.map(ev.subscribers, function(s) {
                return s.email;
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

    $scope.submitAddon = function(addonId) {
        if (!$scope.editEvent) {
            return;
        }

        if ($scope.ev.addons[addonId].id) {
            var data = {
                name: $scope.ev.addons[addonId].name,
                description: $scope.ev.addons[addonId].description,
                price: $scope.ev.addons[addonId].price,
                capacity: $scope.ev.addons[addonId].capacity,
            };

            $http.put('/api/events/' + $scope.ev.id + '/addon/' + $scope.ev.addons[addonId].id, data).success(function(data, status) {
                $scope.ev.addons[addonId].success = 'Sparat!';
                $scope.ev.addons[addonId].error = null;
            }).error(function(data, status) {
                $scope.ev.addons[addonId].error = 'Misslyckades med uppdatering. Testa igen eller skicka ett mail till ict@ingenjorerutangranser.se.';
                $scope.ev.addons[addonId].success = null;
            });
        } else {
            var data = {
                name: $scope.ev.addons[addonId].name,
                description: $scope.ev.addons[addonId].description,
                price: $scope.ev.addons[addonId].price,
                capacity: $scope.ev.addons[addonId].capacity,
            };

            $http.post('/api/events/' + $scope.ev.id + '/addon', data).success(function(data, status) {
                $scope.ev.addons[addonId].id = data.id;
                $scope.ev.addons[addonId].success = 'Lagt till alternativ!';
                $scope.ev.addons[addonId].error = null;
            }).error(function(data, status) {
                $scope.ev.addons[addonId].error = 'Misslyckades med tillägg. Testa igen eller skicka ett mail till ict@ingenjorerutangranser.se.';
                $scope.ev.addons[addonId].success = null;
            });
        }
    };

    $scope.deleteAddon = function(addonId) {
        if (!$scope.editEvent) {
            return;
        }

        if ($scope.ev.addons[addonId].id) {
            $http.delete('/api/events/' + $scope.ev.id + '/addon/' + $scope.ev.addons[addonId].id).success(function(data, status) {
                $scope.ev.addons.splice(addonId, 1);
            }).error(function(data, status) {
                $scope.ev.addons[addonId].error = 'Misslyckades med borttagning. Testa igen eller skicka ett mail till ict@ingenjorerutangranser.se.';
            });
        } else {
            $scope.ev.addons.splice(addonId, 1);
        }
    }

    $scope.increaseAddons = function() {
        $scope.ev.addons.push({});
    };

    $scope.decreaseAddons = function() {
        if ($scope.ev.addons.length > 1) {
            $scope.ev.addons.pop();
        }
    };
});
