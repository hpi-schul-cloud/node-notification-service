import {SentMessageInfo} from 'nodemailer';
import Utils from '@/utils';
import logger from '@/helper/logger';
import Queue, {Job} from 'bee-queue';
import PlatformTransporter from '@/interfaces/PlatformTransporter';
import {PlatformMessage} from '@/interfaces/PlatformMessage';
import { JsonObject } from 'swagger-ui-express';
import FailedJobModel from '@/models/failedJobs';
import { database } from 'firebase-admin';


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

	// done
	// 1. setup notification service 
	// 2. setup with real smtp iones mail
	// 3. evaluade critical parts
	// 4. reconnect strategie
	// 5. remove invalid mail jobs
	// 6. new failed job handling
	// 7. evaluade bee-query and redis settings
	// 8. increase Persistent Volumes Claim (PVC) -> devops
	// 9. clarify colors from production logs
	// 10. try to reproduce throwing save persistent bugs
	// 11. route to access to the stored fail mails, + swagger doku
	// 12. deleted jobs save to db
	//
	// TODO
	// 2. clearify the many connections to redis
	// 3. how to set only schul-cloud template
	// 4. pause query by rate limit
	// 5. cut redis list with old mails -> devops (remove all jobs that are older then 2 weeks)
	// 6. by rollout the next version -> reconfiguration -> Ticket
	// 7. setup documentation
	// 8. fix deploy script -> devops scripts look different to repo scripts 
	// --------------------------
	// clearify which email data should display, log and see over route -> filter
	// Prometheus integration
	// alert if something go wrong of Prometheus base
	// remove cronjob restarts
	// Sentry integration
	// collect process.env for better configuration
	// improve error logging
	// shd connection to notification service -> failed jobs
	// status of resending process of jobs
	// stored time of failed jobs
	// replace all any data types params with specific Datatypes
	// extract test handling code outside of the production pipline example see utils


	public jobErrorHandling(ref: any, job: any, queue: Queue, done: Queue.DoneCallback<{}>) {
		const { receiver, messageId } = job.data;
		const escalation = (message: string , err: any) => {
			// send to sentry
			// add to healt check route
			logger.error('[Critical Error]' + message, err);
		}

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
			/*queue.removeJob(job.id).then(() => {
				console.log('Job is removed', { 
					id: job.id,
					data: job.data,
					err,
				});
			}); 
			*/
			// queue.removeJob(job.id) and job.remove() do not work, but fill with done with null works
		}

		const pausedQuerys = (ref: any, time: number ) => {
			// is already paused?
			// 
		}

		return (error: any) => {
			// TODO outsource error handling for test it in unit tests
			// ionos email provider is use for live systems
			// https://www.ionos.de/hilfe/e-mail/postmaster/smtp-fehlermeldungen-der-11-ionos-mailserver/

			// TODO: make backup jobs over new route avaible
			
			logger.error('[processing queue:' + queue.name + '] failed job ' + job.id, { messageId, receiver });
			// remove jobs with invalid DNS
			if (error.responseCode >= 550) {
				// remove from job
				// save in redis, mongoDB
				// add to healts check route
				backupJob(job, error);
				done(null)
			} else if (error.responseCode === 421 && error.message.includes('421 Rate limit reached. Please try again later')) {
				// TODO: eskalation send email to admin do not work at this position (?)
				// Send to sentry
				// add to healts check route
				// timeout for job query
				const time = 2 * 60 * 1000;
				escalation('Rate limit reached, it is paused for ' + time, error);
				pausedQuerys(ref, time);
				done(error);
			} else if (error.responseCode === 421 && error.message.includes('421 Reject due to policy violations ')) {
				// -> eskalation Sentry
				// add to healts check route
				escalation('Our email account is blocked, please contact iones.', error);
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

		queue.on('ready', () => {
			logger.debug('[queue] ' + queueName + ': ready... execute BaseService.close() for graceful shutdown.');
			// @ts-ignore
			// queue.client.on('error', (err) => {
			//	console.log('xxxxx', err);
			// });
		});
		queue.on('retrying', (job, err) => {
			logger.warn('[queue] ' + queueName + `: Job ${job.id} failed with error ${err.message} but is being retried!`);
		});
		queue.on('failed', (job, err) => {
			logger.error('[queue] ' + queueName + `: Job ${job.id} failed with error ${err.message}`);
		});
		queue.on('stalled', (jobId) => {
			logger.warn('[queue] ' + queueName + `: Job ${jobId} stalled and will be reprocessed`);
		});
		queue.process((job: any, done: Queue.DoneCallback<{}>) => {
			// tslint:disable-next-line: no-shadowed-variable
			const { platformId, message, receiver, messageId } = job.data;
			logger.debug('[queue:' + queueName + '] processing job ' + job.id, { messageId, receiver });
			this.process(platformId, message, receiver, messageId, queue)
				.then((info) => {
					logger.debug('[processing queue:' + queueName + '] finished job ' + job.id, { messageId, receiver });
					done(null, info);
				})
				.catch(this.jobErrorHandling(this, job, queue, done))
				/* .catch((error) => {
					// TODO outsource error handling for test it in unit tests
					// ionos email provider is use for live systems
					// https://www.ionos.de/hilfe/e-mail/postmaster/smtp-fehlermeldungen-der-11-ionos-mailserver/

					// TODO: make backup jobs over new route avaible
					const escalation = (message: string , err: any) => {
						// send to sentry
						// add to healt check route
						logger.error('[Critical Error]' + message, err);
					}

					const removeAndBackupJob = (job: any, err: any) => {
						// save job and error in DB
						// remove job
					}

					const pausedQuerys = (ref: any, time: number ) => {
						// is already paused?
						// 
					}

					// remove jobs with invalid DNS
					if (error.responseCode >= 550) {
						// remove from job
						// save in redis, mongoDB
						// add to healts check route
						removeAndBackupJob(job, error);
					} else if (error.responseCode === 421 && error.message.includes('421 Rate limit reached. Please try again later')) {
						// TODO: eskalation send email to admin do not work at this position (?)
						// Send to sentry
						// add to healts check route
						// timeout for job query
						const time = 2 * 60 * 1000;
						escalation('Rate limit reached, it is paused for ' + time, error);
						pausedQuerys(this, time);
					} else if (error.responseCode === 421 && error.message.includes('421 Reject due to policy violations ')) {
						// -> eskalation Sentry
						// add to healts check route
						escalation('Our email account is blocked, please contact iones.', error);
					}

					logger.error('[processing queue:' + queueName + '] failed job ' + job.id, { messageId, receiver });
					done(error);
				}); */
		});

		queue.checkStalledJobs(2 * 60 * 1000, (err, numStalled) => {
			// prints the number of stalled jobs detected every 120 sec
			console.log('Checked stalled jobs'+platformId, numStalled);
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
