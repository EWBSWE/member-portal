'use strict';

angular.module('ewbMemberApp')
  .controller('MembershipCtrl', function ($scope, $http, $location) {
    $scope.membership = {};

    var stripeHandler = StripeCheckout.configure({
      key: 'pk_test_NkGJralO01ISbEWdNpaPkoWZ',
      token: function (token) {
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
        console.log('success', data);
        $location.path('/receipt').search('id', data._id);
      }).error(function(data) {
        // error with request, communicate accordingly
        alert('sadpanda.png');
        console.log('error', data);
      });
    };

    $scope.paymentOptions = {
      student: {
        oneYear: {
          description: 'Medlemskap som student ett år',
          amount: 40,
        },
        threeYear: {
          description: 'Medlemskap som student tre år',
          amount: 90,
        },
      },
      worker: {
        oneYear: {
          description: 'Medlemskap som yrkesverksam ett år',
          amount: 100,
        },
        threeYear: {
          description: 'Medlemskap som yrkesverksam tre år',
          amount: 250,
        },
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

      var paymentOption = $scope.paymentOptions.worker;
      if ($scope.membership.isStudent === '1') {
        paymentOption = $scope.paymentOptions.student;
      }

      if ($scope.membership.subscriptionLength === '1') {
        paymentOption = paymentOption.oneYear;
      } else {
        paymentOption = paymentOption.threeYear;
      }


      stripeHandler.open({
        name: 'Ingejörer utan gränser',
        description: paymentOption.description,
        // image: 'bild.png', // TODO 
        currency: 'SEK',
        amount: paymentOption.amount * 100,
        email: $scope.membership.email,
      });
    };
  });
