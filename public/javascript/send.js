/**
 * Created by Jan on 12.12.2016.
 */

angular.module('sendApp', [])
  .controller("sendCtrl", function ($scope, $http) {

    $scope.data = {
      title: "Sample Message",
      body: "the long message",
      token: "teacher1_1",
      initiatorId: "1",
      scopeIds: [
        "316866a2-41c3-444b-b82c-274697c546a0"
      ]
    };


    $scope.hide = true;

    $scope.sendRequest = function () {
      return $http({
        method: "POST",
        url: "//localhost:3030/messages",
        data: $scope.data,
        ContentType: "application/json"
      }).then(function success(response) {
        $scope.response = response;
        $scope.id = response.data.id;
        $scope.receivedId = response.data.id;
        $scope.error = false;
        $scope.hide = false;

      }, function error(response) {
        $scope.response = response;
        $scope.error = true;
      });

    };


    $scope.researchID = function () {
      var messageId = $scope.receivedId;

      $scope.messageAttributes = {
        token: "teacher1_1",
        initiatorId: "1",
        id: messageId,
        token: "teacher1_1",
        scopeIds: [
          "316866a2-41c3-444b-b82c-274697c546a0"
        ]
      };
      return $http({
        method: "POST",
        url: "//localhost:3030/messages/" + messageId,
        data: $scope.messageAttributes,
        ContentType: "application/json"
        // method: "GET",
        // url: "//localhost:3030/messages/" + messageId
      }).then(function success(response) {
        $scope.idResponse = response;
        $scope.user = response.data.length;
        var range = [];
        for(var i=0;i<$scope.user;i++) {
          range.push(i);
        }
        $scope.range = range;

      }, function error(response) {
        $scope.idResponse = response;

      });

    };

  });
