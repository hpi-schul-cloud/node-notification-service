import nodeMailer, { SentMessageInfo } from 'nodemailer';
import BaseService from '@/services/BaseService';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';

export default class MailService extends BaseService {
	// endregion

	// region public methods

	// region public static methods
	// endregion

	// region private static methods
	// endregion

	// region public members
	// endregion

	// region private members
	// endregion

	// region constructor
	public constructor() {
		super();
	}
	// endregion

	// region public methods
	protected _send(transporter: PlatformMailTransporter, mail: Mail): Promise<SentMessageInfo> {
		if (mail.attachments) {
			const decodeFiles = (files: Array<{content: any, filename: string}>) => files.map(({ content, filename }) => ({
				filename,
				content: Buffer.from(content, 'base64'),
			}));
			mail.attachments = decodeFiles(mail.attachments);
		}

		return transporter.transporter.sendMail(mail);
	}

	protected _createTransporter(options: any, defaults: any): nodeMailer.Transporter {
		// todo check default from becomes defined
		return nodeMailer.createTransport(options, defaults);
	}

	protected _createTransporters(platformId: string, config: any): PlatformMailTransporter[] {
		const options = Array.isArray(config.mail.options) ? config.mail.options : [config.mail.options];
		const defaults = config.mail.defaults;
		const transporters = options.map((option: any) => this._createTransporter(option, defaults));
		return transporters.map((transporter: nodeMailer.Transporter) => {
			return {
				platformId,
				transporter,
			};
		});
	}

	protected _serviceType(): string {
		return 'mail';
	}

	// endregion

	// region private methods
	// endregion
}
