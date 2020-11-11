import express from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';
import logger from '@/helper/logger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EmailValidator = require('email-deep-validator');

const router = express.Router();
const mailService = new MailService('MailService');

const emailValidatorOptions = {
	timeout: 10000,
	verifyDomain: true,
	verifyMailbox: false,
	logger: logger,
};
const emailValidator = new EmailValidator(emailValidatorOptions);

router.post('/', async (req, res) => {
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
		mailService
			.send(req.body.platformId, mail, mail.to)
			.then((response) => {
				res.send('Mail queued.');
				logger.info(response);
			})
			.catch((error: Error) => {
				logger.error({ error, platformId: req.body.platformId, mail, to: mail.to });
				res.status(500).send('Request failed.');
			});
	}
});

export default router;
