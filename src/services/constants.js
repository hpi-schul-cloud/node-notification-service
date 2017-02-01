'use strict';

class Constants {

  constructor() {

    this.CALLBACK_TYPES = {
      RECEIVED: 'received',
      CLICKED: 'clicked'
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

    this.MESSAGE_PRIORITIES = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };

    this.SERIALIZE = {
      options: {
        id: '_id',
      }
    };

  }

}

module.exports = new Constants();
