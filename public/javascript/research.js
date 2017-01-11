
angular.module('searchApp', [])
  .controller("lookCtrl", function ($scope, $http) {
    $scope.data = {
      title: "Sample Message",
      body: "the long message",
      token: "servicetoken2",
      test: "testMessage",
      scopeIds: [
        "userIdOrScopeId", "testScopeId"
      ]
    };

    $scope.id;
    $scope.hide = true;


    $scope.researchID = function () {
      var messageId = $scope.messageId;
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
