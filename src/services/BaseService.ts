import { SentMessageInfo } from 'nodemailer';
import Utils from '@/utils';
import logger from '@/helper/logger';
import Queue, { Job } from 'bee-queue';
import PlatformTransporter from '@/interfaces/PlatformTransporter';
import {PlatformMessage} from '@/interfaces/PlatformMessage';
import { JsonObject } from 'swagger-ui-express';
import FailedJobModel from '@/models/failedJobs';
import { database } from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/ban-types
function getType(object: object | null) {
	if (object === null) {
		return 'null';
	}
	return object.constructor.name;
}

export default abstract class BaseService {

	private static queues: Queue[] = [];
	private transporters: PlatformTransporter[] = [];
	private name: string = 'NoName';

	protected constructor(name: string) {
		this.name = name;
		let platforms = Utils.getPlatformIds();
		// TODO outsource env in additional file
		if (process.env.TESTPLATFORM !== '1') {
			platforms = platforms.filter((p) => p !== 'testplatform');
		}
		for (const platform of platforms) {
			logger.debug('[queue] init for platform ' + platform + ' and service ' + this._serviceType());
			this.getQueue(platform);
		}
	}

	private paused: boolean = false;

	public static getQueues(): Queue[] {
		return this.queues;
	}
	public static healthState() {
		return Promise.all(
			BaseService.queues.map((queue: Queue) => {
				return queue.checkHealth().then((health: any) => {
					return {
						queue: queue.name,
						health,
					};
				});
			})
		);
	}

	public static close() {
		if (BaseService.queues.length === 0) {
			logger.debug('[queue] no queues to be closed...');
			return Promise.resolve();
		}
		return Promise.all(
			BaseService.queues.map(async (queue) => {
				logger.debug('[queue] ' + queue.name + ' will be closed...');
				try {
					await queue.close();
					logger.debug('[queue] ' + queue.name + ' has been closed.');
					return Promise.resolve();
				} catch (error) {
					logger.error('[queue] failed to gracefully shut down queue ' + queue.name, error);
					return Promise.reject();
				}
			})
		).then(() => Promise.resolve());
	}

	private static selectRandomFromArray(array: any[]): any {
		const randPos: number = Math.floor(Math.random() * array.length);
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

	public async send(platformId: string, message: PlatformMessage, receiver: string, messageId?: string): Promise<string> {
		const config = await Utils.getPlatformConfig(platformId);
		const queue = this.getQueue(platformId);
		return queue.createJob({ platformId, message, receiver, messageId })
			// https://www.npmjs.com/package/bee-queue#jobbackoffstrategy-delayfactor
			// but exponential has a unexpected behavore. With time = 1000 it work nearly like expected
			// (why ever) 3 time with same time and after it double time for each try
			// but with time = 5000 it is run out in very high time first 42 sec, second 82sec, 162 sec and so on
			.backoff(config.queue.backoffStrategy, config.queue.backoffTime)
			.retries(config.queue.retries)
			.timeout(config.queue.timeout)
			.save()
			.then((job: Job) => job.id);
	}

	public directSend(
		platformId: string,
		message: PlatformMessage,
		receiver: string,
		messageId?: string
	): Promise<string> {
		return this.process(platformId, message, receiver, messageId);
	}

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
		let platformTransporters: PlatformTransporter[] = this.transporters.filter((transporter: PlatformTransporter) => {
			return transporter.platformId === platformId;
		});

		if (platformTransporters.length === 0) {
			platformTransporters = this.createTransporters(platformId);
		}

		return BaseService.selectTransporter(platformTransporters);
	}

	public async pausedQueue(time: number) {
		this.paused = true;
		logger.warn(`Query of ${this.name} is in paused mode for ${time} ms`);
		await Utils.Sleep(time);
		logger.warn(`Query of ${this.name} is go in progress.`);
		this.paused = false;
	}

	public jobErrorHandling(job: any, queue: Queue, done: Queue.DoneCallback<{}>, intervallTime: number) {
		// const { receiver, messageId } = job.data;
		const escalation = (message: string , err: any) => {
			// send to sentry
			// add to healt check route
			logger.error('[Critical Error]' + message, err);
		};

		const backupJob = (job: any, err: any) => {
			// do not await to finished
			const receiver = job.data.receiver;
			FailedJobModel.create({
				receiver,
				jobId: job.id,
				data: job.data,
				error: err,
			}, (err: any, doc: any) => {
				if (err) {
					logger.error('Can not store the data for failed job.', job);
				} else {
					logger.error('Removed job is saved!', { id: doc.id, receiver });
				}
			});
		};

		return (error: any) => {
			// TODO outsource error handling for test it in unit tests
			// ionos email provider is use for live systems
			// https://www.ionos.de/hilfe/e-mail/postmaster/smtp-fehlermeldungen-der-11-ionos-mailserver/

			// TODO: make backup jobs over new route avaible

			// logger.error('[processing queue:' + queue.name + '] failed job ' + job.id, { messageId, receiver });
			// remove jobs with invalid DNS
			if (error.responseCode >= 550) {
				// add to healts check route
				backupJob(job, error);
				// queue.removeJob(job.id) and job.remove() do not work, but with done(null) it is removed the job
				done(null);
			} else if (error.responseCode === 421 && error.message.includes('421 Rate limit reached. Please try again later')) {
				// TODO: eskalation send email to admin do not work at this position (?)
				// Send to sentry
				escalation('Rate limit reached, it is paused for ' + intervallTime, error);
				this.pausedQueue(intervallTime);
				done(error);
			} else if (error.responseCode === 421 && error.message.includes('421 Reject due to policy violations')) {
				// -> eskalation Sentry
				escalation('Our email account is blocked, please contact Ionos.', error);
				done(error);
			} else {
				done(error);
			}
		}
	}

	private createQueue(platformId: string): Queue {
		logger.debug('[setup] initialize service queue: ' + this._createQueueName(platformId));
		const redisOptions = Utils.getRedisOptions(platformId);
		const queue = new Queue(this._createQueueName(platformId), redisOptions);
		const queueName = queue.name;
		const intervallTime = 3 * 60 * 1000;

		queue.on('ready', () => {
			logger.debug('[queue] ' + queueName + ': ready... execute BaseService.close() for graceful shutdown.');
		});
		queue.on('retrying', (job, err) => {
			logger.warn('[queue] ' + queueName + `: Job ${job.id} failed with error ${err.message} but is being retried!`);
		});
		queue.on('failed', (job, err) => {
			if (this.paused === true) {
				logger.warn('[queue] ' + queueName + `: Job ${job.id} wait for start sending. ${err.message}`);
			} else {
				logger.error('[queue] ' + queueName + `: Job ${job.id} failed with error ${err.message}`);
			}
		});
		queue.on('stalled', (jobId) => {
			logger.warn('[queue] ' + queueName + `: Job ${jobId} stalled and will be reprocessed`);
		});
		// eslint-disable-next-line @typescript-eslint/ban-types
		queue.process((job: any, done: Queue.DoneCallback<{}>) => {
			if (this.paused === true) {
				return;
			}	
			// tslint:disable-next-line: no-shadowed-variable
			const { platformId, message, receiver, messageId } = job.data;
			logger.debug('[queue:' + queueName + '] processing job ' + job.id, { messageId, receiver });
			this.process(platformId, message, receiver, messageId, queue)
				.then((info) => {
					logger.debug('[processing queue:' + queueName + '] finished job ' + job.id, { messageId, receiver });
					done(null, info);
				})
				.catch(this.jobErrorHandling(job, queue, done, intervallTime))
		});

		queue.checkStalledJobs(intervallTime, (err, numStalled) => {
			// prints the number of stalled jobs detected every 180 sec
			console.log('Checked stalled query jobs in '+platformId+' of '+this.name, numStalled);
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
			})
			.catch((error) => {
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
		const currentQueue: any | undefined = BaseService.queues.find((queue: Queue) => {
			return queue.name === this._createQueueName(platformId);
		});

		if (currentQueue) {
			return currentQueue;
		}

		return this.createQueue(platformId);
	}
}
