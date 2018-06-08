import nodeMailer from 'nodemailer';
import Mail from '@/interfaces/Mail';
import PlatformTransporter from '@/interfaces/PlatformTransporter';

export default class MailService {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members

  private readonly _transporters: PlatformTransporter[] = [];

  // endregion

  // region constructor
  // endregion

  // region public methods

  public async send(platformId: string, mail: Mail): Promise<any> {
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
    const config = require(`../../platforms/${platformId}/config.json`);
    const transporter = nodeMailer.createTransport(config.mail.options, config.mail.defaults);
    const platformTransporter = {
      platformId,
      transporter
    }
    this._transporters.push(platformTransporter);
    return transporter;
  }

  private getTransporter(platformId: string): nodeMailer.Transporter {
    const currentTransporter: PlatformTransporter | undefined = this._transporters.find(
      (transporter: PlatformTransporter) => {
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
