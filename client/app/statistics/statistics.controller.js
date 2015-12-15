'use strict';

angular.module('ewbMemberApp')
  .controller('StatisticsCtrl', function ($scope, $http, Auth, User) {
    $scope.studentCount = 0;
    $scope.workingCount = 0;
    $scope.totalMemberCount = 0;
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
