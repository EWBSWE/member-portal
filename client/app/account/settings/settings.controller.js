'use strict';

angular.module('ewbMemberApp').controller('SettingsCtrl', function ($scope, User, Auth) {
    $scope.errors = {};

    $scope.changePassword = function(form) {
        $scope.submitted = true;
        if(form.$valid) {
            Auth.changePassword($scope.user.password, $scope.user.newPassword).then(function() {
                    $scope.message = 'Password successfully changed.';
                }).catch(function() {
                    $scope.errors.other = 'Incorrect password';
                    $scope.message = 'Incorrect password';
                });
        }
    };
});
