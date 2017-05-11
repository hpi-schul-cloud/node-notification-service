'use strict';
const rp = require('request-promise');
const Constants = require('../../constants');

class EmailAdapter {

  // sending email to a nodemailer endpoint

  send(notifications, devices) {
    // Get Tokens and email content
    return new Promise((resolve, reject) => {
      const token = devices[0].token;
      const data = {
        subject: notifications[0].message.title,
        content: {
          html: notifications[0].message.body + '<br> <a href="' + notifications[0].message.action + '" target="_blank">Hier klicken</a>',
          text: notifications[0].message.body
        }
      };

      const options = {
        method: 'POST',
        uri: Constants.CONFIG.MAILS_API_ENDPOINT,
        headers: {token: token},
        body: data,
        json: true
      };

      rp(options)
        .then(res => {
          // send callback that email was received
          // couldn't get app in here, so I had to do it the old fashioned way
          rp({
            method: 'POST',
            uri: 'http://localhost:3030/callback',
            body: {notificationId: notifications[0]._id, type: Constants.CALLBACK_TYPES.RECEIVED},
            json: true
          });

          let response = this._buildResponse(notifications, devices, res);
          resolve(response);
        })
        .catch(error => {
          let response = this._buildErrorResponse(notifications, devices);
          resolve(response);
        });
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

  _buildErrorResponse(notifications, devices) {
    let response = {
      success: 0,
      failure: notifications.length,
      results: []
    };

    response.results = devices.reduce((accumulator, device, index) => {
      let result = {
        notificationId: notifications[index]._id,
        deviceId: devices[index]._id,
        error: 'Service unavailable'
      };
      return accumulator.concat(result);
    }, []);
  }
}

module.exports = new EmailAdapter();
