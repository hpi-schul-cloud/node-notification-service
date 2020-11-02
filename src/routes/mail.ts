import express, { Router } from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';

const router = express.Router();

export default (mailService: MailService): Router => {
	router.post('/', async (req, res, next) => {
		try {
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

			await mailService.send(req.body.platformId, mail, req.body.to);
			res.send({ msg: 'Mail queued.' });
		} catch (error) {
			next(error);
		}
	});

	return router;
};
