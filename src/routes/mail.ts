import express from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';
import logger from '@/config/logger';

const router: express.Router = express.Router();
const mailService: MailService = new MailService();

router.post('/', (req, res) => {
	const mail: Mail = {
		to: req.body.to,
		subject: req.body.subject,
		text: req.body.text,
		html: req.body.html,
	};

	if (req.body.from) {
		mail.from = req.body.from;
	}

	mailService.send(req.body.platformId, mail, req.body.to)
		.then((response: any) => {
			logger.info(response);
		})
		.catch((error: Error) => {
			logger.error({ error, platformId: req.body.platformId, mail, to: req.body.to });
		});

	res.send('Mail queued.');
});

export default router;
