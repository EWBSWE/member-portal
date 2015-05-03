'use strict';

angular.module('ewbMemberApp')
  .controller('BillingCtrl', function ($scope, $http, socket) {
    $scope.billings = [];

    $http.get('/api/billings').success(function(billings) {
      $scope.billings = billings;
      socket.syncUpdates('billings', $scope.billings);
    });

    $scope.addBilling = function() {
      if($scope.newBilling === '') {
        return;
      }
      $http.post('/api/billings', { name: $scope.newBilling });
      $scope.newBilling = '';
    };

    $scope.deleteBilling = function(billing) {
      $http.delete('/api/billings/' + billing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('billings');
    });
  });
