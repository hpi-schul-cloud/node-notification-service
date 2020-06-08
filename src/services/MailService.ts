import nodeMailer, { SentMessageInfo } from 'nodemailer';
import BaseService from '@/services/BaseService';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from "@/interfaces/PlatformMailTransporter";

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

	protected _createTransporter(config: any): nodeMailer.Transporter {
		// todo check default from becomes defined
		return nodeMailer.createTransport(config.options, config.defaults);
	}

	protected _createTransporters(platformId: string, config: any): PlatformMailTransporter[] {
		const configs = Array.isArray(config.mail) ? config.mail : [config.mail];
		const transporters = configs.map(this._createTransporter);
		return transporters.map((transporter: nodeMailer.Transporter) => {
			return {
				platformId,
				transporter,
			}
		});
	}

	protected _serviceType(): string {
		return 'mail';
	}

	// endregion

	// region private methods
	// endregion
}
