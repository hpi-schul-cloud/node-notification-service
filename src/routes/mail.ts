import express, { Router } from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';
import logger from '@/helper/logger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EmailValidator = require('email-deep-validator');

const router = express.Router();

const emailValidatorOptions = {
	timeout: 10000,
	verifyDomain: true,
	verifyMailbox: false,
	logger: logger,
};
const emailValidator = new EmailValidator(emailValidatorOptions);

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

			const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(mail.to);
			if (!wellFormed) {
				res.send({ message: 'Error: Invalid format' });
			} else if (!validDomain && emailValidatorOptions.verifyDomain) {
				res.send({ message: 'Error: Invalid domain' });
			} else if (!validMailbox && emailValidatorOptions.verifyMailbox) {
				res.send({ message: 'Error: Invalid mailbox' });
			} else {
				const jobId = await mailService.send(req.body.platformId, mail, req.body.to);
				res.send({ message: 'Mail queued.', jobId: jobId });
			}
		} catch (error) {
			next(error);
		}
	});
	return router;
};
