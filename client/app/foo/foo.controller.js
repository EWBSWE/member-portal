'use strict';

angular.module('ewbMemberApp')
  .controller('FooCtrl', function ($scope, $http) {
    $scope.membership = {};

    var stripeHandler = StripeCheckout.configure({
      key: 'pk_test_NkGJralO01ISbEWdNpaPkoWZ',
      token: function (token) {
        console.log(token);
        callback(token);
      }
    });

    var callback = function(token) {
      $http.post('/api/membership', {
        stripeToken: token,
        email: $scope.membership.email,
        isStudent: $scope.membership.isStudent === '1',
        subscriptionLength: $scope.membership.subscriptionLength,
      }).success(function(data) {
        // redirect to receipt/confirmation
        console.log(data);
      }).error(function(data) {
        // error with request, communicate accordingly
        console.log(data);
      });
    };

    $scope.paymentOptions = {
      student: {
        description: 'Studentmedlemskap',
        amount: {
          oneYear: 40,
          threeYear: 90,
        }
      },
      worker: {
        description: 'Medlemskap som yrkesverksam',
        amount: {
          oneYear: 100,
          threeYear: 250,
        }
      },
    };

    $scope.initiatePayment = function() {
      console.log($scope.membership);
      // todo check validate membership details in a more centralized way instead
      // of in the frontend
      // maybe create membership model?
      if ($scope.membership.email === '') {
        return;
      }
      if ($scope.membership.isStudent !== '0' && $scope.membership.isStudent !== '1') {
        return;
      }
      if ($scope.membership.subscriptionLength !== '1' && $scope.membership.subscriptionLength !== '3') {
        return;
      }

      stripeHandler.open({
        name: 'Ingejörer utan gränser',
        description: 'description',
        currency: 'sek',
        amount: 2000,
        email: $scope.membership.email,
      });
    };
  });
