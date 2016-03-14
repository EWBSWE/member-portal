'use strict';

angular.module('ewbMemberApp')
.controller('AdminCtrl', function ($scope, $http) {
    $scope.users = [];

    $http.get('/api/users').success(function(users) {
        $scope.users = users;
    });

    $scope.createUser = function() {
        if (!$scope.email) {
            return;
        }

        $http.post('/api/users', {
            email: $scope.email,
        }).success(function(data) {
            $scope.users.push(data);
            $scope.email = '';
            $scope.showSuccess = true;
            $scope.showError = false;
        }).error(function(data) {
            $scope.showError = true;
            $scope.showSuccess = false;
            $scope.errors = data;
        });
    };

    $scope.deleteUser = function(id) {
        if (!id) {
            return;
        }

        if (!confirm('Are you sure you want to remove user? This action cannot be undone.')) {
            return;
        }

        $http.delete('/api/users/' + id).success(function(data) {
            $scope.users = _.filter($scope.users, function(u) {
                return u._id != id;
            });
            $scope.showError = false;
        }).error(function(data) {
            $scope.showError = true;
            $scope.showSuccess = false;
            $scope.errors = { removal: true };
        });
    };

});
