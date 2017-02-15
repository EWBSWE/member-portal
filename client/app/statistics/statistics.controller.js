'use strict';

angular.module('ewbMemberApp').controller('StatisticsCtrl', function ($scope, $http) {
    $http.get('/api/stats/members').success(function(data) {
        $scope.data = data;
    });
});
