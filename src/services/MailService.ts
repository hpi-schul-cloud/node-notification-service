import { ConfigData } from '@/configuration';
import logger from '@/helper/logger';
import { PlatformMessage } from '@/interfaces/PlatformMessage';
import QueueManager, { JobData } from './QueueManager';
import { Job, JobId, Queue } from 'bull';
import Mail from '@/interfaces/Mail';
import { MailTransport, MailError } from './MailTransport';
import { SentMessageInfo } from 'nodemailer';
import FailedJobModel from '@/models/failedJobs';

const SERVICE_TYPE = 'mail';

export default class MailService {
	private queueManager: QueueManager;
	private platformIds: string[];
	private _transports: MailTransport[] = [];

	get transports(): MailTransport[] {
		return this._transports;
	}

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
	send(platformId: string, message: PlatformMessage, receiver: string, messageId?: string): Promise<JobId> {
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
		logger.debug('Direct send', { platformId, message, receiver, messageId });
		return this.getTransport(SERVICE_TYPE, platformId).deliver(message as Mail);
	}

	private process(job: Job<JobData>): Promise<void> {
		const { platformId, message, receiver, messageId } = job.data;
		logger.debug(
			`[queue] ${job.queue.name} Processing job id: ${job.id}, messageId: ${messageId}, receiver: ${receiver}`
		);
		return this.getTransport(SERVICE_TYPE, platformId)
			.deliver(message as Mail)
			.catch(this.errorHandler(job));
	}

	// TODO refactor to a TransportManager?
	private getTransport(serviceType: string, platformId: string): MailTransport {
		const transports = this.transports.filter((t) => t.serviceType === serviceType && t.platformId === platformId);

		const randPos = Math.floor(Math.random() * transports.length);
		const transport = transports[randPos];

		return transport;
	}

	private errorHandler(job: Job<JobData>) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (error: MailError) => {
			// TODO refactor error handling for better unit testing
			// ionos email provider is used for live systems
			// https://www.ionos.de/hilfe/e-mail/postmaster/smtp-fehlermeldungen-der-11-ionos-mailserver/

			// TODO: make backup jobs available through a route

			// remove jobs with invalid DNS
			if (error.responseCode >= 550) {
				this.backupFailedJob(job, error);
			} else if (
				error.responseCode === 421 &&
				error.message.includes('421 Rate limit reached. Please try again later')
			) {
				const pauseDelay = 3 * 60 * 1000;
				// TODO: eskalation. send email to admin + send to sentry
				logger.error(
					`[Critical Error] Rate limit reached, pausing queue ${job.queue.name} for ${pauseDelay} ms`,
					error
				);
				this.pauseQueue(job.queue, pauseDelay);
			} else if (error.responseCode === 421 && error.message.includes('421 Reject due to policy violations')) {
				logger.error(
					`[Critical Error] E-mail account on queue ${job.queue.name} is blocked, please contact Ionos`,
					error
				);
			}
			throw error;
		};
	}

	private async backupFailedJob(job: Job<JobData>, error: Error): Promise<void> {
		try {
			const doc = await FailedJobModel.create({
				receiver: job.data.receiver,
				jobId: job.id,
				data: job.data,
				error: error,
			});
			logger.debug('Failed job saved', { id: doc.id, receiver: job.data.receiver });
		} catch (error) {
			logger.error('Could not save failed job', job);
		}
	}

	private pauseQueue(queue: Queue, delay: number) {
		logger.debug(`Pausing queue ${queue.name}`);
		queue.pause().then(() => {
			setTimeout(() => {
				logger.debug(`Resuming queue ${queue.name}`);
				queue.resume();
			}, delay);
		});
	}
}
