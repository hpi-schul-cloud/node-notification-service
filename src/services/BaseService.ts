import nodeMailer, { SentMessageInfo } from 'nodemailer';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';
import PlatformQueue from '@/interfaces/PlatformQueue';
import Utils from '@/utils';
import logger from '@/config/logger';
import Queue from 'bee-queue';


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
	// endregion

	// region private members

	private readonly transporters: any[] = [];
	private readonly queues: PlatformQueue[] = [];

	// endregion


	// region constructor

	// endregion

	// region public methods

	public send(platformId: string, message: Mail | firebaseMessaging.Message, receiver: string, messageId?: string): Promise<string> {
		const config = Utils.getPlatformConfig(platformId);
		const queue = this.getQueue(platformId);
		return queue.createJob({ platformId, message, receiver, messageId })
			.retries(config.queue.retries)
			.timeout(config.queue.timeout)
			.save()
			.then((job) => job.id);
	}

	public directSend(platformId: string, message: Mail | firebaseMessaging.Message, receiver: string, messageId?: string): Promise<string> {
		return this.process(platformId, message, receiver, messageId);
	}
	// endregion

	// region private methods

	protected abstract _send(transporter: nodeMailer.Transporter | firebaseMessaging.Messaging, message: Mail | firebaseMessaging.Message): Promise<SentMessageInfo | string>;

	protected abstract _createTransporter(config: any): nodeMailer.Transporter | firebaseMessaging.Messaging;

	protected abstract _createQueue(config: any): Queue;

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

	private createQueue(platformId: string): Queue {
		const config = Utils.getPlatformConfig(platformId);
		const queue = this._createQueue(config);
		queue.process((job: any, done: Queue.DoneCallback<{}>) => {
			const { message, receiver, messageId } = job.data;
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

	private process(platformId: string, message: any, receiver: string, messageId?: string, queue?: Queue) {
		const transporter = this.getTransporter(platformId);
		return this._send(transporter, message)
			.then((info) => {
				logger.info('message sent', {
					queue: queue ? queue.name : 'none',
					platformId,
					transporter: getType(transporter),
					receiver,
					messageId,
				});
				return Promise.resolve(info);
			}).catch((error) => {
				logger.error('message not sent', {
					queue: queue ? queue.name : 'none',
					error,
					platformId,
					transporter: getType(transporter),
					receiver,
					messageId,
				});
				return Promise.reject(error);
			});
	}

	private getQueue(platformId: string): Queue {
		const currentQueue: any | undefined = this.queues.find(
			(queue: PlatformQueue) => {
				return queue.platformId === platformId;
			},
		);

		if (currentQueue) {
			return currentQueue.queue;
		}

		return this.createQueue(platformId);
	}

	// endregion
}
