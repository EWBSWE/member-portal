'use strict';
/* globals StripeCheckout, alert*/
angular.module('ewbMemberApp')
  .controller('MembershipCtrl', function ($scope, $http, $location) {
    $scope.newMember = {};

    var stripeHandler = StripeCheckout.configure({
      key: 'pk_test_NkGJralO01ISbEWdNpaPkoWZ',
      token: function (token) {
        callback(token);
      }
    });

    var callback = function(token) {
      $http.post('/api/payments/confirm', {
        stripeToken: token,
        name: $scope.newMember.name,
        location: $scope.newMember.location,
        profession: $scope.newMember.profession,
        email: $scope.newMember.email,
        telephone: $scope.newMember.telephone,
        isStudent: $scope.newMember.isStudent === '1',
        subscriptionLength: $scope.newMember.subscriptionLength,
      }).success(function(data) {
        // redirect to receipt/confirmation
        console.log('success', data);
        $location.path('/kvitto').search('id', data._id);
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
      console.log($scope.newMember);
      // todo check validate newMember details in a more centralized way instead
      // of in the frontend
      // maybe create newMember model?
      if ($scope.newMember.email === '') {
        return;
      }
      if ($scope.newMember.isStudent !== '0' && $scope.newMember.isStudent !== '1') {
        return;
      }
      if ($scope.newMember.subscriptionLength !== '1' && $scope.newMember.subscriptionLength !== '3') {
        return;
      }

      var paymentOption = $scope.paymentOptions.worker;
      if ($scope.newMember.isStudent === '1') {
        paymentOption = $scope.paymentOptions.student;
      }

      if ($scope.newMember.subscriptionLength === '1') {
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
        email: $scope.newMember.email,
      });
    };
  });
