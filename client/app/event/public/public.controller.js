'use strict';

angular.module('ewbMemberApp')
.controller('EventPublicCtrl', function ($scope, $http, $routeParams, $location) {
    $scope.ev = {};
    $scope.participant = {};

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
            participant: {
                name: $scope.participant.name,
                email: $scope.participant.email,
                comment: $scope.participant.comment,
            },
            identifier: $scope.ev.identifier,
            addonIds: Object.keys($scope.participant.addons),
        }).success(function(data) {
            fetchEvent();
            $scope.successEmail = $scope.participant.email;
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
            ev.notificationOpen = ev.notification_open;
            ev.dueDate = ev.due_date;

            $scope.ev = ev;
            $scope.ev.isPast = moment(ev.dueDate).endOf('day') < moment();
        }).error(function() {
            $location.path('/');
        });
    };

    fetchEvent();

    $scope.initiatePayment = function() {
        if ($scope.form.$invalid) {
            return;
        }

        // Make sure the default addon is selected
        if (!$scope.participant.addons) {
            $scope.participant.addons = {};
        }
        $scope.participant.addons[$scope.ev.addons[0].id] = true;

        var selectedAddonIds = _.filter(Object.keys($scope.participant.addons), function(id) {
          return $scope.participant.addons[id];
        });

        var addonIds = _.map(selectedAddonIds, function(id) {
            return parseInt(id);
        }); 

        var selectedAddons = _.filter($scope.ev.addons, function(addon) {
            return _.include(addonIds, addon.id);
        });

        var sum = 0;
        for (var i = 0; i < selectedAddons.length; i++) {
            sum += parseInt(selectedAddons[i].price);
        }

        console.log(sum, selectedAddons);

        if (sum === 0) {
            callback(null);
        } else if (stripeHandler) {
            stripeHandler.open({
                name: 'Engineers without borders',
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
