import { ConfigData } from '@/configuration';
import Bull, { Queue, ProcessPromiseFunction, JobOptions, JobCounts, JobId, Job } from 'bull';
import logger from '@/helper/logger';
import { PlatformMessage } from '@/interfaces/PlatformMessage';
import { RedisOptions } from 'ioredis';
import { ValidationError } from '@/errors';

export type JobData = {
	serviceType: string;
	platformId: string;
	message: PlatformMessage;
	receiver: string;
	messageId?: string;
};

export default class QueueManager {
	private _queues: Queue[] = [];

	get queues(): Queue[] {
		return this._queues;
	}

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

		// resume on restart
		queue.resume();

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

		// this is important to ensure during startup that we are initially connected to redis
		// otherwise the reconnect doesn't work
		logger.info(`[queue] Checking if ${queue.name} is ready`);
		await queue.isReady();
		logger.info(`[queue] Ok ${queue.name} is ready`);

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
			throw new ValidationError(
				`Could not find queue with platformId='${platformId}' and serviceType='${serviceType}'`,
				[]
			);
		}
		return queue;
	}

	private getQueueName(serviceType: string, platformId: string) {
		return `${serviceType}_${platformId}`;
	}

	private getRedisOptions(config: ConfigData): RedisOptions {
		const options = config.defaults.redis;
		// https://github.com/luin/ioredis#auto-reconnect
		// never retry failed requests
		// NOTE: This is per request!
		options.maxRetriesPerRequest = 0;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options.retryStrategy = (times: number) => {
			return 5000; // reconnect after 5 seconds
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
			logger.error(`[queue] ${queue.name} ${error}`);
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
			logger.debug(`[queue] ${queue.name} ${job ? 'Job id=' + job.id + ' ' : ''}resumed`);
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
