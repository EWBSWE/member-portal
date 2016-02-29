'use strict';
/* globals StripeCheckout, alert*/
angular.module('ewbMemberApp')
.controller('MembershipCtrl', function ($scope, $http, $location, gettextCatalog) {
    $scope.products = [];
    $scope.newMember = {};
    gettextCatalog.setCurrentLanguage('sv');

    $http.get('/api/products/membership').success(function(data) {
        $scope.products = data;
    });

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
        var product = _.find($scope.products, function(p) {
            return p.typeAttributes.memberType === $scope.newMember.type &&
                p.typeAttributes.durationDays === $scope.newMember.subscriptionLength * 365;
        });

        $http.post('/api/payments/confirm', {
            stripeToken: token,
            productId: product._id,
            name: $scope.newMember.name,
            location: $scope.newMember.location,
            profession: $scope.newMember.profession,
            education: $scope.newMember.education,
            email: $scope.newMember.email,
            gender: $scope.newMember.gender,
            type: $scope.newMember.type,
            yearOfBirth: $scope.newMember.yearOfBirth,
        }).success(function(data) {
            $scope.successEmail = data.email;
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

        var product = _.find($scope.products, function(p) {
            return p.typeAttributes.memberType === $scope.newMember.type &&
                p.typeAttributes.durationDays === $scope.newMember.subscriptionLength * 365;
        });

        if (stripeHandler) {
            stripeHandler.open({
                name: gettextCatalog.getString('Engineers without borders'),
                description: gettextCatalog.getString('Membership'),
                // image: 'bild.png', // TODO
                currency: product.currency,
                amount: product.price * 100,
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
