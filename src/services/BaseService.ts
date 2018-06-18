import nodeMailer, { SentMessageInfo } from 'nodemailer';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from "@/interfaces/PlatformMailTransporter";
import PlatformPushTransporter from "@/interfaces/PlatformPushTransporter";
import Utils from "../utils";

export default abstract class BaseService {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members

  public readonly _transporters: any[] = [];

  // endregion

  // region private members
  // endregion

  // region constructor
  // endregion

  // region public methods

  public abstract _send(transporter: nodeMailer.Transporter | firebaseMessaging.Messaging, message: Mail | firebaseMessaging.Message): Promise<SentMessageInfo | String>;

  public abstract _createTransporter(config: any): nodeMailer.Transporter | firebaseMessaging.Messaging;

  public async send(platformId: string, message: Mail | firebaseMessaging.Message): Promise<SentMessageInfo | String> {
    try {
      const transporter = this.getTransporter(platformId);
      return this._send(transporter, message);
    } catch (e) {
      return Promise.reject(new Error('Invalid platformId. Platform config not found.'));
    }
  }

  public createTransporter(platformId: string): nodeMailer.Transporter | firebaseMessaging.Messaging {
    const config = Utils.getPlatformConfig(platformId);
    const transporter = this._createTransporter(config)
    const platformPushTransporter = {
      platformId,
      transporter
    }
    this._transporters.push(platformPushTransporter);
    return transporter;
  }

  public getTransporter(platformId: string): nodeMailer.Transporter | firebaseMessaging.Messaging {
    const currentTransporter: PlatformMailTransporter | PlatformPushTransporter | undefined = this._transporters.find(
      (transporter: PlatformMailTransporter | PlatformPushTransporter) => {
        return transporter.platformId === platformId;
      }
    );

    if (currentTransporter) {
      return currentTransporter.transporter;
    }

    return this.createTransporter(platformId);
  }

  // endregion

  // region private methods
  // endregion
}
