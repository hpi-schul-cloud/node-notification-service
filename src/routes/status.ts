import express, { Router } from 'express';
import QueueManager from '@/services/QueueManager';
import MailService from '@/services/MailService';

const router = express.Router();

export default (queueManager: QueueManager, mailService: MailService): Router => {
	router.get('/health', async (req, res, next) => {
		try {
			const jobCounts = await queueManager.getJobCounts();
			res.json(jobCounts);
		} catch (error) {
			next(error);
		}
	});

	router.get('/transports', async (req, res, next) => {
		try {
			const data = mailService.transports.map((t) => {
				return { serviceType: t.serviceType, platformId: t.platformId, status: t.status };
			});
			res.json(data);
		} catch (error) {
			next(error);
		}
	});
	return router;
};
