import express from 'express';
import FailedJobModel from '@/models/failedJobs';

const router: express.Router = express.Router();

router.get('/:receiver', async (req, res, next) => {
	try {
		const jobs = await FailedJobModel.find({ receiver: req.params.receiver }).lean().exec();
		res.json({
			jobs,
		});
	} catch (err) {
		next(err);
	}

	// TODO get last x entries, or entries from x to y with total size of 100

	// TODO get statistics
});

export default router;
