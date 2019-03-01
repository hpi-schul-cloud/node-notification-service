import nodeMailer, { SentMessageInfo } from 'nodemailer';
import { messaging as firebaseMessaging } from 'firebase-admin';
import Mail from '@/interfaces/Mail';
import PlatformMailTransporter from '@/interfaces/PlatformMailTransporter';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';
import Utils from '@/utils';
import logger from '@/helper/logger';
import Queue, { Job } from 'bee-queue';


function getType(object: object | null) {
	if (object === null) { return 'null'; }
	return object.constructor.name;
}

export default abstract class BaseService {
	// region public static methods
	public static getQueues(): Queue[] {
		return this.queues;
	}
	public static healthState() {
		return Promise.all(BaseService.queues
			.map((queue: Queue) => {
				return queue.checkHealth()
					.then((health: any) => {
						return {
							queue: queue.name,
							health,
						};
					});
			}),
		);
	}

	public static close() {
		if (BaseService.queues.length === 0) {
			logger.debug('[queue] no queues to be closed...');
			return Promise.resolve();
		}
		return Promise.all(BaseService.queues.map(async (queue) => {
			logger.debug('[queue] ' + queue.name + ' will be closed...');
			try {
				await queue.close();
				logger.debug('[queue] ' + queue.name + ' has been closed.');
				return Promise.resolve();
			} catch (error) {
				logger.error('[queue] failed to gracefully shut down queue ' + queue.name, error);
				return Promise.reject();
			}
		})).then(() => Promise.resolve());
	}

	// endregion

	// region public methods


	// endregion

	// region private static methods
	// endregion

	// region public members
	private static queues: Queue[] = [];
	// endregion

	// region private members
	private platformConfig: any;
	private transporters: any[] = [];
	private platforms: string[];

	// endregion


	// region constructor
	protected constructor() {
		this.platforms = Utils.getPlatformIds();
		for (const platform of this.platforms) {
			logger.debug('[queue] init for platform ' + platform + ' and service ' + this._serviceType());
			this.getQueue(platform);
		}
	}

	public async send(platformId: string, message: Mail | firebaseMessaging.Message, receiver: string, messageId?: string): Promise<string> {
		const config = await Utils.getPlatformConfig(platformId);
		const queue = this.getQueue(platformId);
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

	protected _createQueueName(platformId: string): string {
		return platformId + '_' + this._serviceType();
	}
	protected abstract _serviceType(): string;

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
		logger.debug('[setup] initialize service queue: ' + this._createQueueName(platformId));
		const redisOptions = Utils.getRedisOptions(platformId);
		const queue = new Queue(this._createQueueName(platformId), redisOptions);
		queue.on('ready', () => {
			logger.debug('[queue] ' + queue.name + ': ready... execute BaseService.close() for graceful shutdown.');
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
			// tslint:disable-next-line: no-shadowed-variable
			const { platformId, message, receiver, messageId } = job.data;
			logger.debug('[queue:' + queue.name + '] processing job ' + job.id, { messageId, receiver });
			this.process(platformId, message, receiver, messageId, queue)
				.then((info) => {
					logger.debug('[processing queue:' + queue.name + '] finished job ' + job.id, { messageId, receiver });
					done(null, info);
				})
				.catch((error) => {
					logger.error('[processing queue:' + queue.name + '] failed job ' + job.id, { messageId, receiver });
					done(error);
				});
		});
		BaseService.queues.push(queue);
		return queue;
	}

	private async process(platformId: string, message: any, receiver: string, messageId?: string, queue?: Queue) {
		const transporter = await this.getTransporter(platformId);
		logger.debug('send message...', { transporter, platformId, receiver, messageId, queue: queue ? queue.name : null });
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

	private getQueue(platformId: string): Queue {
		const currentQueue: any | undefined = BaseService.queues.find(
			(queue: Queue) => {
				return queue.name === this._createQueueName(platformId);
			},
		);

		if (currentQueue) {
			return currentQueue;
		}

		return this.createQueue(platformId);
	}



	// endregion
}
