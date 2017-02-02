'use strict';

class EmailAdapter {

  // just a mocked response so far, emails will be sent by application

  send(notifications, devices) {
    return new Promise((resolve) => {
      let applicationResponse = {
        success: devices.length,
        failure: 0
      };
      let response = this._buildResponse(notifications, devices, applicationResponse);
      resolve(response);
    });
  }

  _buildResponse(notifications, devices, applicationResponse) {
    let response = {};

    response.success = applicationResponse.success;
    response.failure = applicationResponse.failure;
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
