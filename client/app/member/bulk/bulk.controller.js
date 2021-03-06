"use strict";
/* globals alert*/

angular
  .module("ewbMemberApp")
  .controller("MemberBulkCtrl", function ($scope, $http) {
    var memberTypes = [];
    $http
      .get("/api/members/types")
      .success(function (mts) {
        memberTypes = mts;
      })
      .error(function () {
        alert(
          "Tillfälligt fel, försök att uppdatera sidan. Om problemet kvarstår kontakta ict@ewb-swe.org."
        );
      });

    $scope.addMembers = function () {
      if ($scope.csv === "" || $scope.csv === undefined) {
        return;
      }

      var members = parseCsv($scope.csv);

      $http
        .post("/api/members/bulk", {
          members: members,
        })
        .success(function (data, status) {
          $scope.submittedMembersCount = members.length;
          $scope.addedMembers = data.created;
          $scope.existing = data.existing;

          $scope.validMembers = data.created;
          $scope.updatedMembers = data.updated;
          $scope.invalidMembers = data.invalid;
        })
        .error(function (data, status) {
          if (data.message) {
            alert(data.message);
          } else {
            alert(
              "Internal error, please try again or contact admin if problem persists."
            );
          }
        });
    };

    function parseCsv(csv) {
      var splitMembers = csv.split(/\n/);

      var members = _.map(splitMembers, parseMember);

      return members;
    }

    function parseMember(row) {
      var data = row.trim().split(/,/);

      var member = {
        name: data[0].trim(),
        email: data[1].trim(),
        location: data[2].trim(),
        profession: data[3].trim(),
        education: data[4].trim(),
        memberType: data[5].trim(),
        gender: data[6].trim(),
        yearOfBirth: data[7].trim(),
        expirationDate: moment()
          .add(data[8].trim(), "days")
          .format("YYYY-MM-DD"),
      };

      return member;
    }

    function parseMemberType(mt) {
      var matches = _.filter(memberTypes, function (m) {
        return m.member_type === mt;
      });

      if (matches.length === 0) {
        return null;
      }

      return matches[0].id;
    }

    function parseMemberTypeId(id) {
      var matches = _.filter(memberTypes, function (m) {
        return m.id === id;
      });
      if (matches.length === 0) {
        return null;
      }
      return matches[0].member_type;
    }
  });
