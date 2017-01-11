/**
 * Created by Jan on 12.12.2016.
 */

angular.module('sendApp', [])
  .controller("sendCtrl", function ($scope, $http) {

    $scope.data = {
      title: "Sample Message",
      body: "the long message",
      token: "servicetoken2",
      scopeIds: [
        "useridfürusertoken1"
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
        $scope.id = response.data._id;
        $scope.receivedId = response.data._id;
        $scope.error = false;
        $scope.hide = false;

      }, function error(response) {
        $scope.response = response;
        $scope.error = true;
      });

    };


    $scope.researchID = function () {
      var messageId = $scope.receivedId;

      return $http({

        method: "GET",
        url: "//localhost:3030/messages/" + messageId
      }).then(function success(response) {
        $scope.idResponse = response;
        $scope.user = response.data.length;
        var range = [];
        for(var i=0;i<$scope.user;i++) {
          range.push(i);
        }
        $scope.range = range;
        $scope.test = messageId;

      }, function error(response) {
        $scope.idResponse = response;

      });

    };

  });
