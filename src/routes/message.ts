import express from 'express';
import MessageService from '@/services/MessageService';
import RequestMessage from '@/interfaces/RequestMessage';
import utils from '@/utils';

const router: express.Router = express.Router();

export const messageService: MessageService = new MessageService();

router.post('/', (req, res) => {
	if (utils.parametersMissing(['platform', 'template', 'payload', 'languagePayloads', 'receivers'], req.body, res)) {
		return;
	}

	const message: RequestMessage = {
		platform: req.body.platform,
		template: req.body.template,
		payload: req.body.payload,
		languagePayloads: req.body.languagePayloads,
		receivers: req.body.receivers,
		seenCallback: [],
	};

	if (req.body.sender) {
		message.sender = req.body.sender;
	}

	if (typeof req.body.trackLinks === 'boolean') {
		message.trackLinks = req.body.trackLinks;
	}

	messageService.send(message);

	res.send('Message queued.');
});

/**
 * mark message as seen by given user and optionally responds with redirect url
 */
router.post('/:messageId/seen', async (req, res) => {
	if (utils.parametersMissing(['messageId'], req.params, res)) {
		return;
	}
	if (utils.parametersMissing(['receiverId'], req.body, res)) {
		return;
	}

	try {
		const message = await messageService.seen(req.params.messageId, req.body.receiverId);
		if (req.body.redirect && message && message.payload && req.body.redirect in message.payload) {
			const payload: any = message.payload;
			return res.send({
				redirect: payload[req.body.redirect],
				status: 'success',
			});
		}
		res.send({ status: 'success', redirect: null });
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.post('/user/:userId', async (req, res) => {
	if (utils.parametersMissing(['userId'], req.params, res)) {
		return;
	}

	try {
		const limit = utils.integerInRange(req.body.limit, {
			min: 1,
			max: 100,
			default: 10,
		});
		const skip = utils.integerInRange(req.body.skip, { min: 0, default: 0 });
		const messages = await messageService.byUser(req.params.userId, limit, skip);
		res.send(messages);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.post('/user/:userId/message/:messageId', async (req, res) => {
	if (utils.parametersMissing(['userId', 'messageId'], req.params, res)) {
		return;
	}
	try {
		const message = await messageService.byUserAndMessageId(req.params.userId, req.params.messageId);
		if (message.data === null) {
			return res.send(404);
		}
		res.send(message);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.post('/:messageId/remove/:userId', async (req, res) => {
	if (utils.parametersMissing(['messageId', 'userId'], req.params, res)) {
		return;
	}

	try {
		const message = await messageService.remove(req.params.messageId, req.params.userId);
		res.send(message);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.post('/user/:userId/removeAll', async (req, res) => {
	if (utils.parametersMissing(['userId'], req.params, res)) {
		return;
	}

	try {
		const messages = await messageService.removeAll(req.params.userId);
		res.send(messages);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

router.post('/user/:userId/readAll', async (req, res) => {
	if (utils.parametersMissing(['userId'], req.params, res)) {
		return;
	}

	try {
		const messages = await messageService.readAll(req.params.userId);
		res.send(messages);
	} catch (e) {
		res.status(400).send(e.message);
	}
});

export default router;
