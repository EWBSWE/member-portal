'use strict';

angular.module('ewbMemberApp')
.controller('LoginCtrl', function ($scope, Auth, $location, $http) {
    $scope.user = {};
    $scope.errors = {};
    $scope.resetSuccessful = false;

    var landingPage = '/members';

    if (Auth.isLoggedIn()) {
        if ($location.search().redirect) {
            $location.path($location.search().redirect);
            $location.search('');
        } else {
            console.log('no');
            $location.path(landingPage);
        }
    }

    $scope.login = function(form) {
        $scope.submitted = true;

        if(form.$valid) {
            Auth.login({
                email: $scope.user.email,
                password: $scope.user.password
            })
            .then( function() {
                if ($location.search().redirect) {
                    $location.path($location.search().redirect);
                    $location.search('');
                } else {
                    $location.path(landingPage);
                }
            })
            .catch( function(err) {
                $scope.errors.other = err.message;
            });
        }
    };

    $scope.resetPassword = function () {
        if ($scope.user.email) {
            $http.post('/api/users/reset-password', {
                email: $scope.user.email
            }).success(function (data) {
                $scope.resetSuccessful = true;
            });
        }
    };
});
