import nodeMailer, { SentMessageInfo } from 'nodemailer';
import BaseService from '../services/BaseService';
import Mail from '@/interfaces/Mail';

export default class MailService extends BaseService {
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
  
  public _send(transporter: nodeMailer.Transporter, mail: Mail): Promise<SentMessageInfo> {
    return transporter.sendMail(mail);
  }

  public _createTransporter(config: any): nodeMailer.Transporter {
    return nodeMailer.createTransport(config.mail.options, config.mail.defaults);
  }

  // endregion

  // region private methods
  // endregion
}
