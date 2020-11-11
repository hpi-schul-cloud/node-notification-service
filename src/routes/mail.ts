import express, { Router } from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';
import logger from '@/helper/logger';
import EmailValidator from 'email-deep-validator';

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
				res.send('Error: Invalid format');
			} else if (!validDomain && emailValidatorOptions.verifyDomain) {
				res.send('Error: Invalid domain');
			} else if (!validMailbox && emailValidatorOptions.verifyMailbox) {
				res.send('Error: Invalid mailbox');
			} else {
				await mailService.send(req.body.platformId, mail, req.body.to);
				res.send({ msg: 'Mail queued.' });
			}
		} catch (error) {
			next(error);
		}
	});
	return router;
};
