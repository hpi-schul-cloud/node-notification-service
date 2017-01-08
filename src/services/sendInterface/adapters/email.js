class EmailAdapter {

  // just a mocked response so far, emails will be sent by Schul-Cloud

  send(notifications, devices) {
    return new Promise((resolve) => {
      let schulcloudResponse = {
        success: devices.length,
        failure: 0
      }
      let response = this._buildResponse(notifications, devices, schulcloudResponse);
      resolve(response);
    });
  }

  _buildResponse(notifications, devices, schulcloudResponse) {
    let response = {};

    response.success = schulcloudResponse.success;
    response.failure = schulcloudResponse.failure;
    response.results = notifications.reduce((accumulator, notification, index) => {
      let result = {
        notificationId: notifications[index]._id,
        deviceId: devices[index]._id
      };

      return accumulator.concat(result);
    }, []);

    return response;
  }
}

module.exports = new EmailAdapter();
