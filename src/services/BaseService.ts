import nodeMailer, { SentMessageInfo } from 'nodemailer';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';
import PlatformQueue from '@/interfaces/PlatformQueue';
import Utils from '@/utils';
import logger from '@/config/logger';
import Queue, { Job } from 'bee-queue';


function getType(object: object | null) {
	if (object === null) { return 'null'; }
	return object.constructor.name;
}

export default abstract class BaseService {
	// region public static methods
	// endregion

	// region private static methods
	// endregion

	// region public members
	public readonly queues: PlatformQueue[] = [];
	// endregion

	// region private members

	private readonly transporters: any[] = [];

	// endregion


	// region constructor
	constructor() {
		Utils.getPlatformIds()
			.then((platforms) => {
				platforms.forEach((platform: string) => this.createQueue(platform));
			});
	}

	// endregion

	// region public methods

	public close() {
		return Promise.all(this.queues.map((pq) => {
			logger.debug('[queue] ' + pq.queue.name + ' will be closed...');
			pq.queue.close();
		}));
	}

	public async send(platformId: string, message: Mail | firebaseMessaging.Message, receiver: string, messageId?: string): Promise<string> {
		const config = await Utils.getPlatformConfig(platformId);
		const queue = await this.getQueue(platformId);
		return queue.createJob({ platformId, message, receiver, messageId })
			.retries(config.queue.retries)
			.timeout(config.queue.timeout)
			.save()
			.then((job: Job) => job.id);
	}

	public directSend(platformId: string, message: Mail | firebaseMessaging.Message, receiver: string, messageId?: string): Promise<string> {
		return this.process(platformId, message, receiver, messageId);
	}
	// endregion

	// region private methods

	protected abstract _send(transporter: nodeMailer.Transporter | firebaseMessaging.Messaging, message: Mail | firebaseMessaging.Message): Promise<SentMessageInfo | string>;

	protected abstract _createTransporter(config: any): nodeMailer.Transporter | firebaseMessaging.Messaging;

	protected abstract _createQueue(config: any): Queue;

	private async createTransporter(platformId: string): Promise<nodeMailer.Transporter | firebaseMessaging.Messaging> {
		const config = await Utils.getPlatformConfig(platformId);
		const transporter = this._createTransporter(config);
		const platformPushTransporter = {
			platformId,
			transporter,
		};
		this.transporters.push(platformPushTransporter);
		return transporter;
	}

	private async getTransporter(platformId: string): Promise<nodeMailer.Transporter | firebaseMessaging.Messaging> {
		const currentTransporter: PlatformMailTransporter | PlatformPushTransporter | undefined = this.transporters.find(
			(transporter: PlatformMailTransporter | PlatformPushTransporter) => {
				return transporter.platformId === platformId;
			},
		);

		if (currentTransporter) {
			return currentTransporter.transporter;
		}

		return await this.createTransporter(platformId);
	}

	private async createQueue(platformId: string): Promise<Queue> {
		const config = await Utils.getPlatformConfig(platformId);
		const queue = this._createQueue(config);
		queue.on('ready', () => {
			logger.debug('[queue] ' + queue.name + ': ready...');
		});
		queue.on('retrying', (job, err) => {
			logger.warn('[queue] ' + queue.name + `: Job ${job.id} failed with error ${err.message} but is being retried!`);
		});
		queue.on('failed', (job, err) => {
			logger.error('[queue] ' + queue.name + `: Job ${job.id} failed with error ${err.message}`);
		});
		queue.on('stalled', (jobId) => {
			logger.warn('[queue] ' + queue.name + `: Job ${jobId} stalled and will be reprocessed`);
		});
		queue.process((job: any, done: Queue.DoneCallback<{}>) => {
			const { message, receiver, messageId } = job.data;
			logger.debug('[queue] ' + queue.name + ': processing message' + messageId + ' for receiver ' + receiver);
			return this.process(platformId, message, receiver, messageId, queue)
				.then((info) => done(null, info))
				.catch((error) => done(error));
		});
		const platformQueue: PlatformQueue = {
			platformId,
			queue,
		};
		this.queues.push(platformQueue);
		return queue;
	}

	private async process(platformId: string, message: any, receiver: string, messageId?: string, queue?: Queue) {
		const transporter = await this.getTransporter(platformId);
		return this._send(transporter, message)
			.then((info) => {
				logger.info('[message] sent', {
					queue: queue ? queue.name : null,
					platformId,
					transporter: getType(transporter),
					receiver,
					messageId,
				});
				return Promise.resolve(info);
			}).catch((error) => {
				logger.error('[message] not sent', {
					queue: queue ? queue.name : null,
					error,
					platformId,
					transporter: getType(transporter),
					receiver,
					messageId,
				});
				return Promise.reject(error);
			});
	}

	private async getQueue(platformId: string): Promise<Queue> {
		const currentQueue: any | undefined = this.queues.find(
			(queue: PlatformQueue) => {
				return queue.platformId === platformId;
			},
		);

		if (currentQueue) {
			return currentQueue.queue;
		}

		return await this.createQueue(platformId);
	}



	// endregion
}
