'use strict';

angular.module('ewbMemberApp')
.controller('EventPublicCtrl', function ($scope, $http, $routeParams, gettextCatalog) {
    $scope.ev = {};
    $scope.participant = {};
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
        $http.post('/api/payments/confirm-event', {
            stripeToken: token,
            email: $scope.participant.email,
            identifier: $scope.ev.identifier,
            addonIds: Object.keys($scope.participant.addons),
        }).success(function(data) {
            fetchEvent();
            $scope.successEmail = data.email;
            $('.js-confirmation').modal('show');
            $scope.participant = {};
            $scope.form.$setPristine();
        }).error(function(data) {
            $scope.errorMessage = data.message;
            $('.js-payment-error').modal('show');
        });
    };

    var fetchEvent = function() {
        $http.get('/api/events/public', {
            params: { url: $routeParams.url },
        }).success(function(ev) {
            $scope.ev = ev;
        }).error(function() {
            console.log('NO SUCH EVENT');
            // TODO redirect to missing event
        });
    };

    fetchEvent();

    $scope.initiatePayment = function() {
        if ($scope.form.$invalid) {
            return;
        }

        var addonIds = Object.keys($scope.participant.addons);

        var selectedAddons = _.filter($scope.ev.addons, function(addon) {
            return _.include(addonIds, addon._id);
        });

        var sum = 0;
        for (var i = 0; i < selectedAddons.length; i++) {
            sum += selectedAddons[i].product.price;
        }

        if (sum === 0) {
            callback(null);
        } else if (stripeHandler) {
            stripeHandler.open({
                name: gettextCatalog.getString('Engineers without borders'),
                description: $scope.ev.name,
                // image: 'bild.png', // TODO
                currency: 'SEK',
                amount: sum * 100,
                email: $scope.participant.email,
            });
        } else {
            console.error('stripeHandler not initiated');
        }
    };
});
