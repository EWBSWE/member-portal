'use strict';

angular.module('ewbMemberApp')
  .controller('StatisticsCtrl', function ($scope, $http, Auth, User) {
    $scope.members = [];

    $scope.genderCounts = {
        male: 0,
        female: 0,
        other: 0,
    };

    $scope.birthYears = {};
    $scope.locations = {};

    $scope.studentCount = 0;
    $scope.workingCount = 0;
    $scope.seniorCount = 0;
    $scope.totalMemberCount = 0;

    $http.get('/api/members').success(function(members) {
        $scope.members = members;

        _.each(members, function(member) {
            if (member.type === 'student') {
                $scope.studentCount++;
            } else if (member.type === 'working') {
                $scope.workingCount++;
            } else if (member.type === 'senior') {
                $scope.seniorCount++;
            }

            if (member.gender === 'male') {
                $scope.genderCounts.male++;
            } else if (member.gender === 'female') {
                $scope.genderCounts.female++;
            } else {
                $scope.genderCounts.other++;
            }

            if ($scope.birthYears[member.yearOfBirth] === undefined) {
                $scope.birthYears[member.yearOfBirth] = 1;
            } else {
                $scope.birthYears[member.yearOfBirth]++;
            }

            if ($scope.locations[member.location] === undefined) {
                $scope.locations[member.location] = 1;
            } else {
                $scope.locations[member.location]++;
            }
        });

        // Convert to array to make use of ordering utilities
        $scope.locations = _.map($scope.locations, function(count, name) {
            return { name: name, count: count };
        });
        $scope.birthYears = _.map($scope.birthYears, function(count, name) {
            return { name: name, count: count };
        });
    });

    $scope.data = [];
    $scope.options = {};
    $scope.options.chart = {};
    
    function updateTotalMemberCount(){
        $scope.totalMemberCount = $scope.studentCount + $scope.workingCount;
        $scope.options.chart.caption = {   
                    enable: true,
                    text: 'Total members: ' + $scope.totalMemberCount,
                };
    }
    
    $http.get('/api/members/count/students/true').success(function(studentCount) {
      $scope.studentCount = studentCount;
      $scope.data.push({
                key: "Studenter",
                y: $scope.studentCount
            });
      
            
      updateTotalMemberCount();
    });
    $http.get('/api/members/count/students/false').success(function(workingCount) {
      $scope.workingCount = workingCount;
      $scope.data.push({
                key: "Yrkesverksamma/senior",
                y: $scope.workingCount
            });
      
      updateTotalMemberCount();
    });
    
    
    $scope.options = {
            chart: {
                type: 'pieChart',
                height: 250,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: false,
                duration: 500,
                labelThreshold: 0.01,
                donut: true,
                pie: {
                    startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
                    endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
                },
                valueFormat: function(d){
                    return d3.format(',.0f')(d)
                },
                caption: {   
                    enable: true,
                    text: 'Total members: 0',
                },
                labelSunbeamLayout: true,
                legend: {
                    margin: {
                        top: 5,
                        right: 30,
                        bottom: 5,
                        left: 0
                    }
                }
            }
        };
  });
