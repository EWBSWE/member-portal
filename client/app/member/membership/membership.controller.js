'use strict';
/* globals StripeCheckout, alert*/
angular.module('ewbMemberApp')
  .controller('MembershipCtrl', function ($scope, $http, $location, gettextCatalog) {
    $scope.newMember = {};
    gettextCatalog.setCurrentLanguage('sv');

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
        education: $scope.newMember.education,
        email: $scope.newMember.email,
        gender: $scope.newMember.gender,
        type: $scope.newMember.type,
        yearOfBirth: $scope.newMember.yearOfBirth,
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

    $scope.initiatePayment = function() {
      if ($scope.form.$invalid) {
        return;
      }

      var paymentOptions = {
        student: {
          oneYear: {
            description: gettextCatalog.getString('Membership, student, 1 year'),
            amount: 40,
          },
          threeYear: {
            description: gettextCatalog.getString('Membership, student, 3 years'),
            amount: 90,
          },
        },
        working: {
          oneYear: {
            description: gettextCatalog.getString('Membership, working/senior, 1 year'),
            amount: 100,
          },
          threeYear: {
            description: gettextCatalog.getString('Membership, working/senior, 3 years'),
            amount: 250,
          },
        },
      };

      var paymentOption = paymentOptions.working;
      if ($scope.newMember.type === 'student') {
        paymentOption = paymentOptions.student;
      }

      if ($scope.newMember.subscriptionLength === '1') {
        paymentOption = paymentOption.oneYear;
      } else {
        paymentOption = paymentOption.threeYear;
      }

      if (stripeHandler) {
        stripeHandler.open({
          name: gettextCatalog.getString('Engineers without borders'),
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
