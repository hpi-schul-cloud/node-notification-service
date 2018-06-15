import nodeMailer, { SentMessageInfo } from 'nodemailer';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';
import Utils from '@/utils';

export default class MailService {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members

  private readonly _transporters: PlatformMailTransporter[] = [];

  // endregion

  // region constructor
  // endregion

  // region public methods

  public async send(platformId: string, mail: Mail): Promise<SentMessageInfo | void> {
    try {
      const transporter = this.getTransporter(platformId);
      return transporter.sendMail(mail);
    } catch (e) {
      return Promise.reject(new Error('Invalid platformId. Platform config not found.'));
    }
  }

  // endregion

  // region private methods

  private createTransporter(platformId: string): nodeMailer.Transporter {
    const config = Utils.getPlatformConfig(platformId);
    const transporter = nodeMailer.createTransport(config.mail.options, config.mail.defaults);
    const platformMailTransporter = {
      platformId,
      transporter
    }
    this._transporters.push(platformMailTransporter);
    return transporter;
  }

  private getTransporter(platformId: string): nodeMailer.Transporter {
    const currentTransporter: PlatformMailTransporter | undefined = this._transporters.find(
      (transporter: PlatformMailTransporter) => {
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
