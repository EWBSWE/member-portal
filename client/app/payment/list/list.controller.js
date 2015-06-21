'use strict';

angular.module('ewbMemberApp')
  .controller('PaymentListCtrl', function ($scope, $http, socket) {
    $scope.payments = [];

    $http.get('/api/payments/my').success(function(payments) {
      $scope.payments = payments;
      socket.syncUpdates('payments', $scope.payments);
    });

    $scope.addPayment = function() {
      if($scope.newPayment === '') {
        return;
      }
      $http.post('/api/payments', { name: $scope.newPayment });
      $scope.newPayment = '';
    };

    $scope.deletePayment = function(payment) {
      $http.delete('/api/payments/' + payment._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('payments');
    });
  });
