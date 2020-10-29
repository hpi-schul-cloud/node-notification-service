import { ConfigData } from '@/configuration';
import nodemailer from 'nodemailer';
import util from 'util';
import Mail, { Attachment } from '@/interfaces/Mail';
import logger from '@/helper/logger';

export interface MessageTransport<T> {
	serviceType: string;
	platformId: string;
	deliver(message: T): Promise<void>;
	status: MessageTransportStatus;
}

export type MessageTransportStatus = {
	lastSuccessAt: Date | undefined;
	lastErrorAt: Date | undefined;
	lastError: Error | undefined;
	unavailableSince: Date | undefined;
};

export class MailTransport implements MessageTransport<Mail> {
	private transporter: nodemailer.Transporter;
	private msgDefaults: ConfigData;

	_status: MessageTransportStatus = {
		lastSuccessAt: undefined,
		lastErrorAt: undefined,
		lastError: undefined,
		unavailableSince: undefined,
	};

	/**
	 *
	 * @param _serviceType
	 * @param _platformId
	 * @param config
	 */
	constructor(private _serviceType: string, private _platformId: string, config: ConfigData) {
		this.transporter = nodemailer.createTransport(config.options);
		this.msgDefaults = config.defaults;
	}

	/**
	 *
	 */
	get serviceType(): string {
		return this._serviceType;
	}

	/**
	 *
	 */
	get platformId(): string {
		return this._platformId;
	}

	/**
	 *
	 */
	get status(): MessageTransportStatus {
		return this._status;
	}

	/**
	 *
	 * @param message
	 */
	async deliver(message: Mail): Promise<void> {
		try {
			message.attachments = this.decodeAttachments(message.attachments);

			if (this.msgDefaults.envelope) {
				message.envelope = {
					from: this.msgDefaults.envelope.from || message.from,
					to: this.msgDefaults.envelope.to || message.to,
				};
			}

			const sentInfo = await this.transporter.sendMail(message);

			this._status.lastSuccessAt = new Date();
			this._status.unavailableSince = undefined;

			logger.debug(
				`[transport] Message delivered on ${this.serviceType}/${this.platformId}: ${util.inspect(sentInfo)}`
			);
		} catch (error) {
			this._status.lastErrorAt = new Date();
			this._status.lastError = error;

			// Known E-Mail Errors:
			// - 450: Mail send limit exceeded
			//   {"code":"EENVELOPE","response":"450-Requested mail action not taken: mailbox unavailable\n450 Mail send limit exceeded.",
			//    "responseCode":450,"command":"RCPT TO","rejected":["XXX"],"rejectedErrors":[{...}]}
			// - 535 Authentication credentials invalid (account blocked)
			//   {"code":"EAUTH","response":"535 Authentication credentials invalid","responseCode":535,"command":"AUTH PLAIN"}
			// - 550: Mailbox unavailable (recipient email)
			//   {"code":"EENVELOPE","response":"550-Requested action not taken: mailbox unavailable\n550 invalid DNS MX or A/AAAA resource record",
			//    "responseCode":550,"command":"RCPT TO","rejected":["XXX"],"rejectedErrors":[{...}]}
			if (error && error.responseCode && (error.responseCode === 450 || error.responseCode === 535)) {
				this._status.unavailableSince = new Date();
			}
			throw error;
		}
	}

	// --------------------------------------------------------------------------

	private decodeAttachments(attachments: Attachment[] = []): Attachment[] {
		return attachments.map((att) => {
			return {
				filename: att.filename,
				content: Buffer.from(att.content.toString(), 'base64'),
			};
		});
	}
}
