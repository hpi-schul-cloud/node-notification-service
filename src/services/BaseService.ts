import {SentMessageInfo} from 'nodemailer';
import Utils from '@/utils';
import logger from '@/helper/logger';
import Queue, {Job} from 'bee-queue';
import PlatformTransporter from '@/interfaces/PlatformTransporter';
import {PlatformMessage} from '@/interfaces/PlatformMessage';


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

	private static selectRandomFromArray(array: any[]): any {
		const randPos: number = Math.floor((Math.random() * array.length));
		return array[randPos];
	}

	private static selectTransporter(platformTransporters: PlatformTransporter[]): PlatformTransporter {
		// TODO: Enable logic to avoid using unavailable transporters for one hour
		// function inLastHour(moment: Date): boolean {
		// 	const timeDifference = new Date().getTime() - moment.getTime();
		// 	return timeDifference < 1000 * 60 * 60; // 1 hour in milliseconds
		// }
		// const healthyTransporters = platformTransporters.filter((transporter) => {
		// 	return !(transporter.unavailableSince && BaseService.inLastHour(transporter.unavailableSince));
		// });
		//
		// if (healthyTransporters.length > 0) {
		// 	return BaseService.selectRandomFromArray(healthyTransporters);
		// }

		return BaseService.selectRandomFromArray(platformTransporters);
	}
	// endregion

	// region private members
	private transporters: PlatformTransporter[] = [];
	// endregion


	// region constructor
	protected constructor() {
		const platforms = Utils.getPlatformIds();
		for (const platform of platforms) {
			logger.debug('[queue] init for platform ' + platform + ' and service ' + this._serviceType());
			this.getQueue(platform);
		}
	}
	// endregion

	// region public methods
	public async send(platformId: string, message: PlatformMessage, receiver: string, messageId?: string): Promise<string> {
		const config = await Utils.getPlatformConfig(platformId);
		const queue = this.getQueue(platformId);
		return queue.createJob({ platformId, message, receiver, messageId })
			.backoff('fixed', 2000 * 60) // 2min
			.retries(config.queue.retries)
			.timeout(config.queue.timeout)
			.save()
			.then((job: Job) => job.id);
	}

	public directSend(platformId: string, message: PlatformMessage, receiver: string, messageId?: string): Promise<string> {
		return this.process(platformId, message, receiver, messageId);
	}
	// endregion

	// region private methods

	protected abstract _send(transporter: PlatformTransporter, message: PlatformMessage): Promise<SentMessageInfo | string>;

	protected abstract _createTransporters(platformId: string, config: any): PlatformTransporter[];

	protected _createQueueName(platformId: string): string {
		return platformId + '_' + this._serviceType();
	}
	protected abstract _serviceType(): string;

	private createTransporters(platformId: string): PlatformTransporter[] {
		const config = Utils.getPlatformConfig(platformId);
		const newTransporters = this._createTransporters(platformId, config);

		for (const transporter of newTransporters) {
			this.transporters.push(transporter);
		}

		return newTransporters;
	}

	private getTransporter(platformId: string): PlatformTransporter {
		let platformTransporters: PlatformTransporter[] = this.transporters.filter(
			(transporter: PlatformTransporter) => {
				return transporter.platformId === platformId;
			},
		);

		if (platformTransporters.length === 0) {
			platformTransporters = this.createTransporters(platformId);
		}

		return BaseService.selectTransporter(platformTransporters);
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
					transporter: getType(transporter.transporter),
					receiver,
					messageId,
				});

				// update transporter
				transporter.lastSuccessAt = new Date();
				transporter.unavailableSince = undefined;

				return Promise.resolve(info);
			}).catch((error) => {
				logger.error('[message] not sent', {
					queue: queue ? queue.name : null,
					error,
					platformId,
					transporter: getType(transporter.transporter),
					receiver,
					messageId,
				});

				// update transporter
				transporter.lastErrorAt = new Date();
				transporter.lastError = error;

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
					transporter.unavailableSince = new Date();
				}

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
