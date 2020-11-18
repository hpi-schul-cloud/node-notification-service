import express, { Router } from 'express';
import QueueManager from '@/services/QueueManager';

const router = express.Router();

export default (queueManager: QueueManager): Router => {
	router.get('/health', async (req, res, next) => {
		try {
			const jobCounts = await queueManager.getJobCounts();
			res.send(jobCounts);
		} catch (error) {
			next(error);
		}
	});
	return router;
};
