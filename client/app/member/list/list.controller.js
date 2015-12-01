'use strict';
/* globals confirm*/

angular.module('ewbMemberApp')
  .controller('MemberListCtrl', function ($scope, $http) {
    $scope.members = [];
    $scope.sortBy = 'name';
    $scope.sortReverse = false;

    $http.get('/api/members').success(function(members) {
      $scope.members = members;
    });

    $scope.deleteUser = function(id) {
      if (confirm('Are you sure you want to remove user? This action cannot be undone.')) {
        $http.delete('/api/members/' + id).success(function(member) {
          $http.get('/api/members').success(function(members) {
            $scope.members = members;
          });
        });
      }
    };

    $scope.generateCsv = function() {
      if ($scope.members.length === 0) {
        return;
      }

      var membersToExport = $scope.members;
      if ($scope.emailFilter || $scope.locationFilter) {
        var tmp = [];

        _.each($scope.members, function (member) {
          if ($scope.emailFilter && $scope.filterByEmail(member)) {
            tmp.push(member);
          } else if ($scope.locationFilter && $scope.filterByLocation(member)) {
            tmp.push(member);
          }
        });

        membersToExport = tmp;
      }

      var keysToIgnore = ['_id', '__v', '$$hashKey'];
      var csvContent = 'data:text/csv;charset=utf-8,';

      var memberKeys = Object.keys($scope.members[0]);
      _.remove(memberKeys, function(key) {
        return _.contains(keysToIgnore, key);
      });

      // Create headers of the member keys
      csvContent += memberKeys.join(',') + '\n';

      _.each(membersToExport, function(member, index) {
        csvContent += _.map(memberKeys, function(key) {
          return member[key];
        }).join(',');

        if (index < $scope.members.length) {
          csvContent += '\n';
        }
      });

      window.open(encodeURI(csvContent));
    };

    $scope.filterByEmail = function(member) {
      if (!$scope.emailFilter) {
        return true;
      }

      return member.email.match(new RegExp($scope.emailFilter, 'i'));
    };

    $scope.filterByLocation = function (member) {
      if (!$scope.locationFilter) {
        return true;
      }

      return member.location.match(new RegExp($scope.locationFilter, 'i'));
    };
  });
