'use strict';

class Constants {

  constructor() {

    let BASE_PATH = process.env.BASE_PATH || 'https://schulcloud-api-mock.herokuapp.com';

    this.CONFIG = {
      AUTHENTICATION_API_ENDPOINT : BASE_PATH + (process.env.AUTHENTICATION_API_ENDPOINT || '/api/user/'),
      AUTHORIZATION_API_ENDPOINT  : BASE_PATH + (process.env.AUTHORIZATION_API_ENDPOINT || '/api/all_scopes/'),
      RESOLVE_API_ENDPOINT        : BASE_PATH + (process.env.RESOLVE_API_ENDPOINT || '/api/all_users/'),
      MAILS_API_ENDPOINT          : BASE_PATH + (process.env.MAILS_API_ENDPOINT || '/mails/'),
      CALLBACK_API_ENDPOINT       : BASE_PATH + (process.env.CALLBACK_API_ENDPOINT || '/notification/callback/')
    };

    this.AUTHORITIES = {
      CAN_SEND_NOTIFICATIONS : 'can-send-notifications'
    };

    this.CALLBACK_TYPES = {
      RECEIVED: 'received',
      CLICKED: 'clicked',
      READ: 'read'
    };

    this.NOTIFICATION_STATES = {
      CREATED: 'created',
      ESCALATING: 'escalating',
      NOT_ESCALATED: 'not_escalated',
      ESCAlATED: 'escalated',
      SEEN: 'seen',
      CLICKED: 'clicked',
      REMOVED: 'removed'
    };

    this.DEVICE_TYPES = {
      //ACTIVE: 'active',
      DESKTOP_MOBILE: 'desktop_mobile',
      DESKTOP: 'desktop',
      MOBILE: 'mobile',
      EMAIL: 'email'
    };

    this.DEVICE_STATES = {
      REGISTERED: 'registered',
      FAILED: 'failed'
    };

    this.MESSAGE_PRIORITIES = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };

    this.SEND_SERVICES = {
      APN: 'apn',
      EMAIL: 'email',
      FIREBASE: 'firebase'
    };

    this.SERIALIZE = {
      options: {
        id: '_id',
      }
    };

  }

}

module.exports = new Constants();
