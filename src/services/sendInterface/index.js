'use strict';

class SendInterface {

  sendToMobile(notification) {

    console.log('[INFO] sending notification to mobile');

    // TODO insert sending magic

    notification.changeState('sent to mobile');

    console.log('[INFO] notification was sent to mobile');

    return Promise.resolve( notification );

  }

  sendToWeb(notification) {

     console.log('[INFO] sending notification to web');

      // TODO insert sending magic

      notification.changeState('sent to web');

      console.log('[INFO] notification was sent to web');

      return Promise.resolve( notification );
  }

}

module.exports = new SendInterface();
