import nodeMailer, { SentMessageInfo } from 'nodemailer';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';
import Utils from '@/utils';

export default abstract class BaseService {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members

  private readonly transporters: any[] = [];

  // endregion

  // region constructor
  // endregion

  // region public methods

  public async send(platformId: string, message: Mail | firebaseMessaging.Message): Promise<SentMessageInfo | string> {
    try {
      const transporter = this.getTransporter(platformId);
      return this._send(transporter, message);
    } catch (e) {
      return Promise.reject(new Error(e.message));
    }
  }

  // endregion

  // region private methods

  protected abstract _send(transporter: nodeMailer.Transporter | firebaseMessaging.Messaging,
                           message: Mail | firebaseMessaging.Message): Promise<SentMessageInfo | string>;

  protected abstract _createTransporter(config: any): nodeMailer.Transporter | firebaseMessaging.Messaging;

  private createTransporter(platformId: string): nodeMailer.Transporter | firebaseMessaging.Messaging {
    const config = Utils.getPlatformConfig(platformId);
    const transporter = this._createTransporter(config);
    const platformPushTransporter = {
      platformId,
      transporter,
    };
    this.transporters.push(platformPushTransporter);
    return transporter;
  }

  private getTransporter(platformId: string): nodeMailer.Transporter | firebaseMessaging.Messaging {
    const currentTransporter: PlatformMailTransporter | PlatformPushTransporter | undefined = this.transporters.find(
      (transporter: PlatformMailTransporter | PlatformPushTransporter) => {
        return transporter.platformId === platformId;
      },
    );

    if (currentTransporter) {
      return currentTransporter.transporter;
    }

    return this.createTransporter(platformId);
  }

  // endregion
}
