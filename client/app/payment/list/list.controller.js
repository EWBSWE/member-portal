'use strict';

angular.module('ewbMemberApp')
.controller('PaymentListCtrl', function ($scope, $http) {
    $scope.payments = [];
    $scope.report = {
        periodStart: moment().subtract(1, 'month').format('YYYY-MM-DD'),
        periodEnd: moment().add(1, 'day').format('YYYY-MM-DD'),
        recipient: null,
    };
    $scope.validParams = {};

    $http.get('/api/payments').success(function(payments) {
        $scope.payments = payments;
    });

    $scope.generateReport = function() {
        if (!$scope.report.periodStart || !$scope.report.periodEnd || !$scope.report.recipient) {
            return;
        }

        $http.get('/api/payments/report', {
            params: {
                periodStart: $scope.report.periodStart.trim(),
                periodEnd: $scope.report.periodEnd.trim(),
                recipient: $scope.report.recipient.trim(),
            }
        }).success(function(response) {
            $scope.success = $scope.report.recipient;
            $scope.report.recipient = null;
            $scope.validParams = {};
        }).error(function(response) {
            $scope.validParams = response;
        });
    };
});
