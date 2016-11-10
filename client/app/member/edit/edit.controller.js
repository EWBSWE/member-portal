'use strict';

angular.module('ewbMemberApp')
    .controller('MemberEditCtrl', function ($scope, $http, $routeParams, $location) {
        $scope.member = {};
        $scope.showError = false;
        $scope.showSuccess = false;
        $scope.editMember = $routeParams.id;

        if ($routeParams.id) {
            $http.get('/api/members/' + $routeParams.id).success(function(member) {
                if (member.expiration_date) {
                    member.expirationDate = new Date(member.expiration_date);
                }
                member.yearOfBirth = member.year_of_birth;
                member.memberTypeId = member.member_type_id;

                $scope.member = member;
            });
        }

        $http.get('/api/member-types').success(function(memberTypes) {
            $scope.memberTypes = memberTypes;
        });

        var addMember = function() {
            $scope.successMessages = {};

            if (!$scope.member.name) {
                return;
            } else if (!$scope.member.email) {
                return;
            }

            var expirationDate = null;
            if ($scope.member.expirationDate) {
                expirationDate = moment($scope.member.expirationDate).format();
            } else if ($scope.member.subscriptionLength === '1') {
                expirationDate = moment().add(1, 'year').format();
            } else if ($scope.member.subscriptionLength === '3') {
                expirationDate = moment().add(3, 'year').format();
            }

            $http.post('/api/members', {
                name: $scope.member.name,
                location: $scope.member.location,
                profession: $scope.member.profession,
                education: $scope.member.education,
                email: $scope.member.email, 
                memberTypeId: $scope.member.memberTypeId,
                gender: $scope.member.gender,
                memberType: $scope.member.type,
                yearOfBirth: $scope.member.yearOfBirth,
                expirationDate: expirationDate,
            }).success(function(data, status) {
                $scope.showSuccess = true;
                $scope.member = {};
            }).error(function(data, status) {
                $scope.showError = true;
            });
        };

        var updateMember = function() {
            $http.put('/api/members/' + $scope.member.id, {
                name: $scope.member.name,
                location: $scope.member.location,
                profession: $scope.member.profession,
                email: $scope.member.email, 
                education: $scope.member.education,
                memberTypeId: $scope.member.memberTypeId,
                gender: $scope.member.gender,
                yearOfBirth: $scope.member.yearOfBirth,
                expirationDate: $scope.member.expirationDate ? moment($scope.member.expirationDate).format() : null,
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
            $http.get('/api/members').success(function(members) {
                var matches = _.filter(members, function(m) {
                    return m.email === email.trim();
                });

                if (matches.length > 0) {
                    $location.path('/member/' + matches[0].id + '/edit');
                } else {
                    alert('Hittar ingen med epost: "' + email + '"');
                }
            });
        };
    });
