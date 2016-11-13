'use strict';

angular.module('ewbMemberApp')
.controller('SettingListCtrl', function ($scope, $http) {
    $scope.settings = [];

    $http.get('/api/settings').success(function(settings) {
        $scope.settings = settings;
    });
});
