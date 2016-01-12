'use strict';

angular.module('ewbMemberApp')
  .controller('MemberEditCtrl', function ($scope, $http, $routeParams) {
    $scope.member = {};
    $scope.showError = false;
    $scope.showSuccess = false;
    $scope.editMember = $routeParams.id;

    if ($routeParams.id) {
      $http.get('/api/members/' + $routeParams.id).success(function(member) {
        member.expirationDate = new Date(member.expirationDate);
        $scope.member = member;
      });
    }

    var addMember = function() {
      $scope.successMessages = {};

      if (!$scope.member.name) {
        return;
      } else if (!$scope.member.location) {
        return;
      } else if (!$scope.member.profession) {
        return;
      } else if (!$scope.member.email) {
        return;
      } else if (!$scope.member.telephone) {
        return;
      } else if (!$scope.member.student) {
        return;
      } else if (!$scope.member.expirationDate && !$scope.member.subscriptionLength) {
        return;
      }

      var expirationDate = null;
      if ($scope.member.expirationDate) {
        expirationDate = moment($scope.member.expirationDate);
      } else if ($scope.member.subscriptionLength === '1') {
        expirationDate = moment().add(1, 'year');
      } else if ($scope.member.subscriptionLength === '3') {
        expirationDate = moment().add(3, 'year');
      }

      $http.post('/api/members', {
        name: $scope.member.name,
        location: $scope.member.location,
        profession: $scope.member.profession,
        telephone: $scope.member.telephone,
        email: $scope.member.email, 
        student: $scope.member.student,
        expirationDate: expirationDate.format(),
      }).success(function(data, status) {
        $scope.showSuccess = true;
        $scope.member = {};
      }).error(function(data, status) {
        $scope.showError = true;
      });
    };

    var updateMember = function() {
      $http.put('/api/members/' + $scope.member._id, {
        name: $scope.member.name,
        location: $scope.member.location,
        profession: $scope.member.profession,
        telephone: $scope.member.telephone,
        email: $scope.member.email, 
        student: $scope.member.student,
        expirationDate: moment($scope.member.expirationDate).format(),
      }).success(function(data, status) {
        $scope.showSuccess = true;
      }).error(function(data, status) {
        $scope.showError = true;
      });
    };

    $scope.submit = function() {
      if ($scope.editMember) {
        updateMember();
      } else {
        addMember();
      }
    };

    $scope.findByEmail = function(email) {
      if (!email) {
        return;
      }
      $http.get('/api/members', { params: { email: email.trim() } }).success(function(members) {
        if (members.length) {
          var member = members[0];
          member.expirationDate = new Date(member.expirationDate);
          $scope.member = member;
          $scope.editMember = true;
        } else {
          alert('Hittar ingen med epost: "' + email + '"');
        }
      });
    };
  });
