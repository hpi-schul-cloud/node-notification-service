import FailedJobModel from '@/models/failedJobs';
import logger from '@/helper/logger';
import BaseService from '@/services/BaseService';
import { Job } from 'bee-queue';

export default class Admin {
	private dayOffset = 24 * 60 * 60 * 1000;

	private getDateWithOffset(baseDate: Date, offset = 0): Date {
		const d = new Date();
		d.setTime(baseDate.getTime() + offset);
		return d;
	}

	private solvedFromUntil(from?: string, until?: string, offset = 0): any {
		let $lt;
		if (!from && !until) {
			$lt = new Date();
		} else {
			$lt = until ? new Date(until) : undefined;
		}
		let $gte = from ? new Date(from) : undefined;

		if ($gte && !$lt) {
			$lt = this.getDateWithOffset($gte, offset);
		}

		if (!$gte && $lt) {
			$gte = this.getDateWithOffset($lt, -offset);
		}
		return { $gte, $lt };
	}

	public getFailedJobByReceiver(receiver: string): Promise<any> {
		logger.info('Admin look into getFailedJobByReceiver receiver=' + receiver);
		return FailedJobModel.find({ receiver }).lean().exec();
	}

	public getFailedJobByDate(from?: string, until?: string): Promise<any> {
		const { $gte, $lt } = this.solvedFromUntil(from, until, this.dayOffset);
		logger.info('Admin look into getFailedJobByDate from ' + $gte + ' until=' + $lt);
		return FailedJobModel.find({ createdAt: { $gte, $lt } }).lean().exec();
	}

	// TODO create Interface for filteredJobs
	private extractJobData(job: Job): any {
		return {
			id: job.id,
			receiver: job.data.receiver,
		};
	}

	private getJobs(statusType: string, start = 0, end = 1000): any {
		const querys = BaseService.getQueues();
		let jobs = [] as Array<any>;

		querys.forEach(async (q) => {
			const queryJobs = await q.getJobs(statusType, { start, end });
			const filteredJobs = queryJobs.map(this.extractJobData);
			jobs = [...jobs, ...filteredJobs];
		});

		return jobs;
	}

	// https://github.com/bee-queue/bee-queue#queuegetjobstype-page-cb
	public getQueryJops(start: any, end: any): any {
		logger.info('Admin look into jobs start' + start + ' end=' + end);
		const waitingJobs = this.getJobs('waiting', start, end);
		const failedJobs = this.getJobs('failed', start, end);

		return { waitingJobs, failedJobs };
	}
}
