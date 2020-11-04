import { ConfigData } from '@/configuration';
import Bull, { Queue, ProcessPromiseFunction, JobOptions, JobCounts, JobId, Job } from 'bull';
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

		logger.debug(`[queue] Initializing service queue ${name}`);

		const queue = new Bull<JobData>(name, {
			prefix: config.defaults.prefix,
			redis: this.getRedisOptions(config),
			defaultJobOptions: this.getJobOptions(config),
			settings: {
				stalledInterval: config.defaults.stallInterval,
			},
		});

		this.attachQueueEventHandlers(queue);
		this.attachRedisEventHandlers(queue);

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
		logger.info(`[queue] Starting service worker for ${queue.name}`);
		queue.process(callback);
	}

	/**
	 *
	 * @param data
	 */
	async addJob(data: JobData): Promise<JobId> {
		const queue = this.findQueue(data.serviceType, data.platformId);
		const job = await queue.add(data);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { message, ...logData } = data;
		logger.debug(`[queue] ${queue.name} Job id=${job.id} added:`, logData);
		return job.id;
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
			logger.error('Unable to connect to Redis server, retrying...', { times });
			return 10000;
		};
		logger.debug('[queue] Redis config: ', options);
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

	private attachQueueEventHandlers(queue: Queue) {
		// https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#events
		queue.on('error', (error) => {
			logger.error(`[queue] ${queue.name} Error: ${error}`);
		});
		queue.on('waiting', (jobId) => {
			// A Job is waiting to be processed as soon as a worker is idling.
			logger.debug(`[queue] ${queue.name} Job id=${jobId} waiting`);
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		queue.on('active', (job, jobPromise) => {
			// A job has started. You can use `jobPromise.cancel()`` to abort it.
			logger.debug(`[queue] ${queue.name} Job id=${job.id} active`);
		});
		queue.on('stalled', (job) => {
			// A job has been marked as stalled. This is useful for debugging job
			// workers that crash or pause the event loop.
			logger.error(`[queue] ${queue.name} Job id=${job.id} stalled`);
		});
		queue.on('progress', (job, progress) => {
			// A job's progress was updated!
			logger.debug(`[queue] ${queue.name} Job id=${job.id} progress`, progress);
		});
		queue.on('completed', (job, result) => {
			// A job successfully completed with a `result`.
			logger.debug(`[queue] ${queue.name} Job id=${job.id} completed`, result);
		});
		queue.on('failed', (job, error) => {
			// A job failed with reason `error`!
			logger.error(`[queue] ${queue.name} Job id=${job.id} failed`, error);
		});
		queue.on('paused', () => {
			// The queue has been paused.
			logger.debug(`[queue] ${queue.name} paused`);
		});
		queue.on('resumed', (job: Job<JobData>) => {
			// The queue has been resumed.
			logger.debug(`[queue] ${queue.name} Job id=${job.id} resumed`);
		});
		queue.on('cleaned', (jobs, type) => {
			// Old jobs have been cleaned from the queue. `jobs` is an  of cleaned
			// jobs, and `type` is the type of jobs cleaned.
			logger.debug(`[queue] ${queue.name} Jobs ids=${jobs.map((j) => j.id)} cleaned`, type);
		});
		queue.on('drained', () => {
			// Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
			logger.debug(`[queue] ${queue.name} drained`);
		});
		queue.on('removed', (job) => {
			// A job successfully removed.
			logger.info(`[queue] ${queue.name} Job id=${job.id} removed`);
		});
	}

	private attachRedisEventHandlers(queue: Queue) {
		// https://github.com/luin/ioredis#connection-events
		queue.client.on('connect', (...args) => {
			logger.debug(`[redis] ${queue.name} connect`, args);
		});
		queue.client.on('ready', (...args) => {
			logger.debug(`[redis] ${queue.name} ready`, args);
		});
		queue.client.on('error', (...args) => {
			logger.debug(`[redis] ${queue.name} error`, args);
		});
		queue.client.on('close', (...args) => {
			logger.debug(`[redis] ${queue.name} close`, args);
		});
		queue.client.on('reconnecting', (...args) => {
			logger.debug(`[redis] ${queue.name} reconnecting`, args);
		});
		queue.client.on('end', (...args) => {
			logger.debug(`[redis] ${queue.name} end`, args);
		});
	}
}
