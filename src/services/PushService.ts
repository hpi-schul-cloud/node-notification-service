import admin from 'firebase-admin';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';

export default class PushService {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members

  private readonly _transporters: PlatformPushTransporter[] = [];

  // endregion

  // region constructor
  // endregion

  // region public methods

  public async send(platformId: string, push: admin.messaging.Message): Promise<any> {
    try {
      const transporter = this.getTransporter(platformId);
      return transporter.messaging().send(push);
    } catch (e) {
      return Promise.reject(new Error('Invalid platformId. Platform config not found.'));
    }
  }

  // endregion

  // region private methods

  private createTransporter(platformId: string): admin.app.App {
    const config = require(`../../platforms/${platformId}/config.json`);
    const transporter = admin.initializeApp({
      credential: admin.credential.cert(config.push.service_account_object),
      databaseURL: config.push.database_url
    });
    const platformPushTransporter = {
      platformId,
      transporter
    }
    this._transporters.push(platformPushTransporter);
    return transporter;
  }

  private getTransporter(platformId: string): admin.app.App {
    const currentTransporter: PlatformPushTransporter | undefined = this._transporters.find(
      (transporter: PlatformPushTransporter) => {
        return transporter.platformId === platformId;
      }
    );

    if (currentTransporter) {
      return currentTransporter.transporter;
    }

    return this.createTransporter(platformId);
  }

  // endregion
}
