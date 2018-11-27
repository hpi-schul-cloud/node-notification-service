import firebaseAdmin, { messaging as firebaseMessaging } from 'firebase-admin';
import BaseService from '@/services/BaseService';

export default class PushService extends BaseService {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members
  // endregion

  // region constructor
  // endregion

  // region public methods

  protected _send(transporter: firebaseMessaging.Messaging, push: firebaseMessaging.Message): Promise<string> {
    return transporter.send(push);
  }

  protected _createTransporter(config: any): firebaseMessaging.Messaging {
    return firebaseAdmin.initializeApp({
      // https://stackoverflow.com/questions/40799258/where-can-i-get-serviceaccountcredentials-json-for-firebase-admin
      credential: firebaseAdmin.credential.cert(config.push.service_account_object),
      databaseURL: config.push.database_url,
    }).messaging();
  }

  // endregion

  // region private methods
  // endregion
}
