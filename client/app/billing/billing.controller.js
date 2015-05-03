'use strict';

angular.module('ewbMemberApp')
  .controller('BillingCtrl', function ($scope, $http, socket) {
    $scope.billings = [];

    $http.get('/api/billing').success(function(billings) {
      $scope.billings = billings;
      socket.syncUpdates('billing', $scope.billings);
    });

    $scope.addBilling = function() {
      if($scope.newBilling === '') {
        return;
      }
      console.log('add billing');
      $http.post('/api/billing', { name: $scope.newBilling });
      $scope.newBilling = '';
    };

    $scope.deleteBilling = function(billing) {
      $http.delete('/api/billing/' + billing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('billing');
    });
  });
