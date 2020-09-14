import express from 'express';
import BaseService from '@/services/BaseService';
const router: express.Router = express.Router();

router.get('/health', async (req, res) => {
	try {
		const health = await BaseService.healthState();
		res.send(health);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

export default router;
