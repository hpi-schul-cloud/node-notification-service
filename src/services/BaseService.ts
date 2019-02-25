import nodeMailer, { SentMessageInfo } from 'nodemailer';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';
import Utils from '@/utils';
import logger from '@/config/logger';


function getType(object: Object | null) {
	if (object === null) { return 'null'; }
	return object.constructor.name;
}

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

	public send(platformId: string, message: Mail | firebaseMessaging.Message, receiver: string, messageId?: string): Promise<SentMessageInfo | string> {
		let transporter: any = null;
		try {
			transporter = this.getTransporter(platformId);
		} catch (error) {
			return Promise.reject(error);
		}
		return this._send(transporter, message)
			.then((info) => {
				logger.info('message sent', { platformId, transporter: getType(transporter), receiver, messageId });
				return Promise.resolve(info);
			}).catch((error) => {
				logger.error('message not sent', { error, platformId, transporter: getType(transporter), receiver, messageId });
				return Promise.resolve();
			});
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
