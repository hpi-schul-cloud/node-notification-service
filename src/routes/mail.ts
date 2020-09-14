import express from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';
import logger from '@/helper/logger';

const router = express.Router();
const mailService = new MailService('MailService');


router.post('/', (req, res) => {
	const mail: Mail = {
		to: req.body.to,
		replyTo: req.body.replyTo,
		subject: req.body.subject,
		text: req.body.text,
		html: req.body.html,
		attachments: req.body.attachments,
	};

	if (req.body.from) {
		mail.from = req.body.from;
	}

	mailService.send(req.body.platformId, mail, req.body.to)
		.then((response: any) => {
			res.send('Mail queued.');
			logger.info(response);
		})
		.catch((error: Error) => {
			logger.error({ error, platformId: req.body.platformId, mail, to: req.body.to });
			res.status(500).send('Request failed.');
		});
});

export default router;
