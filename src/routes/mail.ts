import express from 'express';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';
import logger from '@/helper/logger';
import TemplatingService from '@/services/TemplatingService';
import UserResource from '@/interfaces/UserResource';
import Utils from '@/utils';

const router = express.Router();
const mailService = new MailService();


router.post('/', async (req, res) => {
	let templatingService: TemplatingService;
	const messageId = Utils.guid();

	let receiver: UserResource = {
		mail: req.body.to,
		language: 'de',
		payload: {},
		name: '',
		userId: '',
		preferences: {}
	};

	templatingService = await TemplatingService.create(req.body.platform, req.body.template,
		req.body.payload, req.body.languagePayloads, messageId, receiver.language);

	const mail = await templatingService.createMailMessage(receiver);

	// const mail: Mail = {
	// 	to: req.body.to,
	// 	subject: req.body.subject,
	// 	text: req.body.text,
	// 	html: req.body.html,
	// };

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
