'use strict';

angular.module('ewbMemberApp')
.controller('SettingListCtrl', function ($scope, $http) {
    $scope.settings = [];
    $scope.newSetting = {};
    $scope.modifiedSetting = {};

    $http.get('/api/settings').success(function(settings) {
        $scope.settings = settings;
    });

    $scope.showEditFor = function(someSetting) {
        $scope.modifiedSetting = Object.assign({}, someSetting);
    };

    $scope.updateSetting = function() {
        var someSetting = $scope.modifiedSetting;

        if (!someSetting.value || !someSetting.description) {
            return;
        }

        $http.put('/api/settings/' + someSetting._id, {
            value: someSetting.value,
            description: someSetting.description,
        }).success(function(updatedSetting) {
            _.each($scope.settings, function(setting) {
                if (setting._id === updatedSetting._id) {
                    setting.value = updatedSetting.value;
                    setting.description = updatedSetting.description;
                    setting.success = true;
                }
            });
        }).error(function(data) {
            _.each($scope.settings, function(setting) {
                if (setting._id === someSetting._id) {
                    setting.success = false;
                }
            });
        });
    };
});
