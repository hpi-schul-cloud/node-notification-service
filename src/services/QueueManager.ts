import { ConfigData } from '@/configuration';
import Bull, { Queue, ProcessPromiseFunction, JobOptions, JobCounts } from 'bull';
import logger from '@/helper/logger';
import { PlatformMessage } from '@/interfaces/PlatformMessage';
import { RedisOptions } from 'ioredis';

export type JobData = {
	serviceType: string;
	platformId: string;
	message: PlatformMessage;
	receiver: string;
	messageId?: string;
};

export default class QueueManager {
	private queues: Queue[] = [];

	/**
	 *
	 * @param serviceType
	 * @param platformId
	 * @param config the queue config
	 */
	createQueue(serviceType: string, platformId: string, config: ConfigData): Queue {
		const name = this.getQueueName(serviceType, platformId);

		logger.debug(`[queue] initialize service queue ${name} with config:\n`, config);

		const queue = new Bull<JobData>(name, {
			prefix: config.defaults.prefix,
			redis: this.getRedisOptions(config),
			defaultJobOptions: this.getJobOptions(config),
			settings: {
				stalledInterval: config.defaults.stallInterval,
			},
		});

		// TODO Do we need a ready event? In Bull this is only provided via Queue.isReady()

		queue.on('error', (err) => {
			logger.error(`[queue] ${queue.name} failed with error ${err.message}`);
		});

		queue.on('failed', (job, err) => {
			logger.error(`[queue] ${queue.name} Job ${job.id} failed with error ${err.message}`);
			// TODO log 'retrying'
		});

		queue.on('stalled', (job) => {
			logger.warn(`[queue] ${queue.name}: Job ${job.id} stalled and will be reprocessed`);
		});

		// TODO check if there's already a queue with the same name
		this.queues.push(queue);

		return queue;
	}

	/**
	 *
	 * @param serviceType
	 * @param platformId
	 * @param callback
	 */
	async startWorker(serviceType: string, platformId: string, callback: ProcessPromiseFunction<JobData>): Promise<void> {
		const queue = this.findQueue(serviceType, platformId);

		logger.debug(`[queue] Checking if ${queue.name} is ready`);
		await queue.isReady();
		logger.debug(`[queue] Ok ${queue.name} is ready`);

		logger.debug(`[queue] Starting service worker for ${queue.name}`);
		queue.process(callback);
	}

	/**
	 *
	 * @param data
	 */
	async addJob(data: JobData): Promise<void> {
		const queue = this.findQueue(data.serviceType, data.platformId);
		await queue.add(data);
		logger.debug(`[queue] ${queue.name} job added:`, { data });
	}

	/**
	 *
	 */
	async getJobCounts(): Promise<{ queue: string; health: JobCounts }[]> {
		return await Promise.all(
			this.queues.map(async (q) => {
				return {
					queue: q.name,
					health: await q.getJobCounts(),
				};
			})
		);
	}

	/**
	 *
	 */
	async closeAll(): Promise<void> {
		await Promise.all(
			this.queues.map(async (queue) => {
				logger.debug(`[queue] Closing queue ${queue.name}...`);
				await queue.close();
				logger.debug(`[queue] Queue ${queue.name} has been closed.`);
			})
		);
	}

	// --------------------------------------------------------------------------

	private findQueue(serviceType: string, platformId: string): Queue {
		const queue = this.queues.find((q) => q.name === this.getQueueName(serviceType, platformId));
		if (!queue) {
			// TODO throw a more specific error that can be evaluated to a status code (422)
			throw new Error(`Could not find queue with platformId='${platformId}' and serviceType='${serviceType}'`);
		}
		return queue;
	}

	private getQueueName(serviceType: string, platformId: string) {
		return `${serviceType}_${platformId}`;
	}

	private getRedisOptions(config: ConfigData): RedisOptions {
		const options = config.defaults.redis;

		// https://www.npmjs.com/package/ioredis#auto-reconnect
		options.retryStrategy = (times: number) => {
			// one hour every 10 sec retry
			if (times >= config.defaults.redisRetryAttempts) {
				logger.error('[critical] Unable to connect to the Redis server - Notification Service is going to exit!');
				process.exit(1);
			}
			logger.error('Unable to connect to the Redis server ..retry', { times });
			return 10000;
		};
		logger.debug('redis config: ', options);
		return options;
	}

	private getJobOptions(config: ConfigData): JobOptions {
		return {
			backoff: {
				type: config.backoffStrategy,
				delay: config.backoffTime,
			},
			attempts: config.retries,
			timeout: config.timeout,
			removeOnComplete: config.defaults.removeOnSuccess,
			removeOnFail: config.defaults.removeOnFailure,
		};
	}
}
