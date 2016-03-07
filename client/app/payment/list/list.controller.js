'use strict';

angular.module('ewbMemberApp')
.controller('PaymentListCtrl', function ($scope, $http) {
    $scope.payments = [];
    $scope.from = null;
    $scope.to = null;
    $scope.email = null;

    $http.get('/api/payments').success(function(payments) {
        $scope.payments = payments;
    });

    $scope.generateReport = function() {
        if (!$scope.from || !$scope.to || !$scope.email) {
            return;
        }

        $http.get('/api/payments/generate-report', {
            from: $scope.from.trim(),
            to: $scope.to.trim(),
            email: $scope.email.trim(),
        }).success(function(response) {
            console.log('success', response);
        }).error(function(response) {
            console.log('fail', response);
        });
    };
});
