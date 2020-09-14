import logger from '@/helper/logger';
import MailService from '@/services/MailService';
import PushService from '@/services/PushService';
import TemplatingService from '@/services/TemplatingService';
import MessageModel from '@/models/message';
import Utils from '@/utils';
import DeviceService from '@/services/DeviceService';
import Message from '@/interfaces/Message';

export default class EscalationLogic {
	private mailService = new MailService('EscalationLogicMailService');
	private pushService = new PushService('EscalationLogicPushService');

	public async escalate(messageId: string) {
		const databaseMessage = await MessageModel.findById(messageId);
		if (!databaseMessage) {
			const errorMessage = `Could not escalate Message: Message (id: ${messageId}) not found.`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		const message: Message = databaseMessage.toObject();

		// Construct Templating Service
		let templatingService: TemplatingService;

		// Send push messages
		for (const receiver of message.receivers) {
			if (!receiver.preferences.push) {
				continue;
			}
			const services = Utils.serviceEnum();
			for (const service of services) {
				const receiverDevices = await DeviceService.getDevices(message.platform, receiver.userId, service);
				for (const device of receiverDevices) {
					// todo avoid recreation of templatingService for each receiver device/user
					templatingService = await TemplatingService.create(message.platform, message.template,
						message.payload, message.languagePayloads, messageId, receiver.language);
					if (service === 'firebase') {
						const pushMessage = await templatingService.createPushMessage(receiver, device);
						// FIXME add queuing, add rest route for queue length
						(await this.pushService).send(message.platform, pushMessage, device, messageId);
					}
					if (service === 'safari') {
						// const pushMessage = templatingService.createSafariPushMessage(receiver, device);
						// // FIXME add queuing, add rest route for queue length
						// this.pushService.send(message.platform, pushMessage);
						logger.error('unsupported send service requested: ' + service);
					}
				}
			}
		}

		// Send mail messages after 4 hours delay
		const config = await Utils.getPlatformConfig(message.platform);
		setTimeout(() => { this.sendMailMessages(messageId); }, config.mail.defaults.delay);
		// todo send mail message without delay if there was no push device registered
	}

	private async sendMailMessages(messageId: string) {
		// Fetch message again to get updated list of receivers
		const message = await MessageModel.findById(messageId);

		if (!message) {
			const errorMessage = `Could not send mail messages: Message (id: ${messageId}) not found.`;
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		for (const receiver of message.receivers) {
			if (!receiver.preferences.mail) {
				continue;
			}

			const templatingService = await TemplatingService.create(message.platform, message.template,
				message.payload, message.languagePayloads, messageId, receiver.language);

			const mailMessage = await templatingService.createMailMessage(receiver);
			// FIXME add queuing, add rest route for queue length
			(await this.mailService).send(message.platform, mailMessage, receiver.userId.toString(), messageId);
		}
	}
}
