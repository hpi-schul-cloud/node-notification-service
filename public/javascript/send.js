/**
 * Created by Jan on 12.12.2016.
 */

angular.module('sendApp', [])
  .controller("sendCtrl", function ($scope, $http) {
    $scope.data = {
      title: "dlasjd",
      body: "the long message",
      token: "servicetoken2",
      scopeIds: [
        "userIdOrScopeId", "testScopeId"
      ]
    };

    $scope.sendRequest = function () {
      return $http({
        method: "POST",
        url: "//localhost:3030/messages",
        data: $scope.data,
        ContentType: "application/json"
      }).then(function success(response) {
        $scope.response = response;
        $scope.error = false;

      }, function error(response) {
        $scope.response = response;
        $scope.error = true;
      });

    };

  });
