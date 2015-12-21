'use strict';
/* globals StripeCheckout, alert*/
angular.module('ewbMemberApp')
  .controller('MembershipCtrl', function ($scope, $http, $location, gettextCatalog, gettext) {
    $scope.newMember = {};

    var stripeHandler;

    $http.get('/api/payments/stripe-checkout').success(function (data) {
      stripeHandler = StripeCheckout.configure({
        key: data.key,
        token: function (token) {
          callback(token);
        }
      });
    }).error(function (data) {
      console.log('error', data);
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
        $scope.successEmail = data.member.email;
        $('.js-confirmation').modal('show');
        $scope.newMember = {};
        $scope.form.$setPristine();
      }).error(function(data) {
        $scope.errorMessage = data.message;
        $('.js-payment-error').modal('show');
      });
    };

    // TODO fetch payment options from api?
    $scope.paymentOptions = {
      student: {
        oneYear: {
          description: gettext('Membership, student, 1 year'),
          amount: 40,
        },
        threeYear: {
          description: gettext('Membership, student, 3 years'),
          amount: 90,
        },
      },
      worker: {
        oneYear: {
          description: gettext('Membership, working/senior, 1 year'),
          amount: 100,
        },
        threeYear: {
          description: gettext('Membership, working/senior, 3 years'),
          amount: 250,
        },
      },
    };


    $scope.initiatePayment = function() {
      if ($scope.form.$invalid) {
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

      if (stripeHandler) {
        stripeHandler.open({
          name: 'Ingenjörer utan gränser',
          description: paymentOption.description,
          // image: 'bild.png', // TODO
          currency: 'SEK',
          amount: paymentOption.amount * 100,
          email: $scope.newMember.email,
        });
      } else {
        console.error('stripeHandler not initiated');
      }
    };

    $scope.setCurrentLanguage = function (lang) {
      gettextCatalog.setCurrentLanguage(lang);
    };
  });
