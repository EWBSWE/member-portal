'use strict';

angular.module('ewbMemberApp')
       .controller('AdminCtrl', function ($scope, $http, Auth) {
           $scope.users = [];

           $scope.isAdmin = Auth.isAdmin();

           $http.get('/api/users')
                .success(function(users) {
                    $scope.users = users;
                });

           $scope.createUser = function() {
               if (!$scope.email) {
                   return;
               }

               $http.post('/api/users', { email: $scope.email })
                    .success(function(data) {
                        $scope.users.push({ email: $scope.email, role: 'user' });

                        $scope.email = '';
                        $scope.showSuccess = true;
                        $scope.showError = false;
                    })
                    .error(function(data) {
                        $scope.showError = true;
                        $scope.showSuccess = false;
                        $scope.errors = { removal: false };
                    });
           };

           $scope.deleteUser = function(id) {
               if (!id) {
                   return;
               }

               if (!confirm('Are you sure you want to remove user? This action cannot be undone.')) {
                   return;
               }

               $http.delete('/api/members/' + id).success(function(data) {
                   $scope.users = _.filter($scope.users, function(u) {
                       return u.id != id;
                   });
                   $scope.showError = false;
               }).error(function(data) {
                   $scope.showError = true;
                   $scope.showSuccess = false;
                   $scope.errors = { removal: true };
               });
           };

       });
