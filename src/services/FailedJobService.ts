import FailedJobModel from '@/models/failedJobs';
import logger from '@/helper/logger';

export default class FailedJobService {
	public getJobByReceiver(receiver: string) {
		return FailedJobModel.find({ receiver }).lean().exec();
	}
}
