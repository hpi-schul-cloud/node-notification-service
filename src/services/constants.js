'use strict';

class Constants {

  constructor(options) {

    this.CONFIG = {
      AUTH_API_ENDPOINT : 'https://schulcloud-api-mock.herokuapp.com/api/user/',
      RESOLVE_API_ENDPOINT : 'https://schulcloud-api-mock.herokuapp.com/api/all_users/'
    }

    this.AUTHORITIES = {
      CAN_SEND : 'canWrite'
    }

    this.CALLBACK_TYPES = {
      RECEIVED : 'received',
      CLICKED : 'clicked'
    }

    this.NOTIFICATION_STATES = {
      CREATED: 'created',
      ESCALATING: 'escalating',
      NOT_ESCALATED: 'not_escalated',
      ESCAlATED: 'escalated',
      SEEN: 'seen',
      CLICKED: 'clicked',
      REMOVED: 'removed'
    }

    this.DEVICE_TYPES = {
      //ACTIVE: 'active',
      DESKTOP_MOBILE: 'desktop_mobile',
      DESKTOP: 'desktop',
      MOBILE: 'mobile',
      EMAIL: 'email'
    }

    this.MESSAGE_PRIORITIES = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    }

  }


}

module.exports = new Constants();
