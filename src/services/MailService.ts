import { ConfigData } from '@/configuration';
import logger from '@/helper/logger';
import { PlatformMessage } from '@/interfaces/PlatformMessage';
import QueueManager, { JobData } from './QueueManager';
import { Job } from 'bull';
import Mail from '@/interfaces/Mail';
import { MailTransport } from './MailTransport';
import { SentMessageInfo } from 'nodemailer';

const SERVICE_TYPE = 'mail';

export default class MailService {
	private queueManager: QueueManager;
	private platformIds: string[];
	private transports: MailTransport[] = [];

	/**
	 *
	 * @param queueManager
	 * @param configuration
	 */
	constructor(queueManager: QueueManager, configuration: ConfigData[]) {
		this.queueManager = queueManager;
		this.platformIds = configuration.map((cfg) => {
			queueManager.createQueue(SERVICE_TYPE, cfg.platformId, cfg.queue);

			const mailOptions = Array.isArray(cfg.mail.options)
				? (cfg.mail.options as ConfigData[])
				: ([cfg.mail.options] as ConfigData[]);
			mailOptions.forEach((options) => {
				this.transports.push(new MailTransport(SERVICE_TYPE, cfg.platformId, { options, defaults: cfg.mail.defaults }));
			});

			return cfg.platformId;
		});
	}

	/**
	 *
	 */
	async startWorkers(): Promise<void> {
		await Promise.all(
			this.platformIds.map(async (platformId) => {
				return this.queueManager.startWorker(SERVICE_TYPE, platformId, this.process.bind(this));
			})
		);
	}

	/**
	 *
	 * @param platformId
	 * @param message
	 * @param receiver
	 * @param messageId
	 */
	send(platformId: string, message: PlatformMessage, receiver: string, messageId?: string): Promise<void> {
		return this.queueManager.addJob({ serviceType: SERVICE_TYPE, platformId, message, receiver, messageId });
	}

	/**
	 *
	 * @param platformId
	 * @param message
	 * @param receiver
	 * @param messageId
	 */
	directSend(
		platformId: string,
		message: PlatformMessage,
		receiver: string,
		messageId?: string
	): Promise<SentMessageInfo> {
		logger.debug('direct send', { platformId, message, receiver, messageId });
		return this.getTransport(SERVICE_TYPE, platformId).deliver(message as Mail);
	}

	private process(job: Job<JobData>): Promise<void> {
		const { platformId, message, receiver, messageId } = job.data;
		logger.debug(
			`[queue] ${job.queue.name} processing job id: ${job.id}, messageId: ${messageId}, receiver: ${receiver}`
		);
		return this.getTransport(SERVICE_TYPE, platformId).deliver(message as Mail);
	}

	// TODO refactor to a TransportManager?
	private getTransport(serviceType: string, platformId: string): MailTransport {
		const transports = this.transports.filter((t) => t.serviceType === serviceType && t.platformId === platformId);

		const randPos = Math.floor(Math.random() * transports.length);
		const transport = transports[randPos];

		if (!transport) {
			throw new Error(`Could not find transport with platformId='${platformId}' and serviceType='${serviceType}'`);
		}

		return transport;
	}
}
