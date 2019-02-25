import nodeMailer, { SentMessageInfo } from 'nodemailer';
import BaseService from '@/services/BaseService';
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

	protected _send(transporter: nodeMailer.Transporter, mail: Mail): Promise<SentMessageInfo> {
		return transporter.sendMail(mail);
	}

	protected _createTransporter(config: any): nodeMailer.Transporter {
		// todo check default from becomes defined
		return nodeMailer.createTransport(config.mail.options, config.mail.defaults);
	}

	// endregion

	// region private methods
	// endregion
}
