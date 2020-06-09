"use strict";
/* globals StripeCheckout, alert*/
angular
  .module("ewbMemberApp")
  .controller("MembershipCtrl", function ($scope, $http, $location) {
    $scope.products = [];
    $scope.newMember = {};

    $http.get("/api/products/membership").success(function (data) {
      $scope.products = data;
    });
    $http.get("/api/members/chapters").success(function (data) {
      $scope.availableChapters = data;
    });

    var stripeHandler;
    $http
      .get("/api/payments/stripe-checkout")
      .success(function (data) {
        stripeHandler = StripeCheckout.configure({
          key: data.key,
          token: function (token) {
            callback(token);
          },
        });
      })
      .error(function (data) {
        console.log("error", data);
      });

    var findMatchingProduct = function () {
      var product = _.find($scope.products, function (p) {
        return (
          p.attribute.member_type === $scope.newMember.memberType &&
          p.attribute.days === $scope.newMember.subscriptionLength * 365
        );
      });

      return product;
    };

    var callback = function (token) {
      var product = findMatchingProduct();

      $http
        .post("/api/members/membership", {
          stripeToken: token,
          productId: +product.id,
          name: $scope.newMember.name,
          location: $scope.newMember.location,
          profession: $scope.newMember.profession,
          education: $scope.newMember.education,
          email: $scope.newMember.email,
          gender: $scope.newMember.gender,
          yearOfBirth: $scope.newMember.yearOfBirth,
          chapterId: +$scope.newMember.chapterId,
          employer: $scope.newMember.employer,
        })
        .success(function (data) {
          $scope.successEmail = $scope.newMember.email;
          $(".js-confirmation").modal("show");
          $scope.newMember = {};
          $scope.form.$setPristine();
        })
        .error(function (data) {
          var errorMessage =
            "We failed to complete your transaction. No payment processed.";
          if (data.errorType === "StripeCardError") {
            errorMessage = "Your card was declined. No payment processed.";
          } else if (data.errorType === "RateLimitError") {
            // Too many requests made to the API too quickly
          } else if (data.errorType === "StripeInvalidError") {
            // Invalid parameters were supplied to Stripe's API
          } else if (data.errorType === "StripeAPIError") {
            // An error occurred internally with Stripe's API
          } else if (data.errorType === "StripeConnectionError") {
            // Some kind of error occurred during the HTTPS communication
          } else if (data.errorType === "StripeAuthenticationError") {
            // Probably used incorrect API key
          }

          $scope.errorMessage = errorMessage;
          $(".js-payment-error").modal("show");
        });
    };

    $scope.initiatePayment = function () {
      if ($scope.form.$invalid) {
        return;
      }

      var product = findMatchingProduct();

      if (stripeHandler) {
        stripeHandler.open({
          name: "Engineers without borders",
          description: "Membership",
          // image: 'bild.png', // TODO
          currency: product.currency_code,
          amount: product.price * 100,
          email: $scope.newMember.email,
        });
      } else {
        console.error("stripeHandler not initiated");
      }
    };

    $scope.renewalMode =
      $location.path() === "/renew" ||
      $location.path() === "/fornya-medlemskap";
  });
