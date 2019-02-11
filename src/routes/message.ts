import express from 'express';
import MessageService from '@/services/MessageService';
import RequestMessage from '@/interfaces/RequestMessage';

const router: express.Router = express.Router();
const messageService: MessageService = new MessageService();

router.post('/', (req, res) => {
  if (!req.body.platform) {
    res.status(400).send('Missing body parameter: platform.');
  }
  if (!req.body.template) {
    res.status(400).send('Missing body parameter: template.');
  }
  if (!req.body.payload) {
    res.status(400).send('Missing body parameter: payload.');
  }
  if (!req.body.languagePayloads) {
    res.status(400).send('Missing body parameter: languagePayloads.');
  }
  if (!req.body.receivers) {
    res.status(400).send('Missing body parameter: receivers.');
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
  if (!req.params.messageId) {
    res.status(400).send('Missing url parameter: messageId.');
  }
  if (!req.body.receiverId) {
    res.status(400).send('Missing body parameter: userId.');
  }

  try {
    const message = await messageService.seen(req.params.messageId, req.body.receiverId);
    if (req.body.redirect && message && message.payload && req.body.redirect in message.payload) {
      const payload: any = message.payload;
      return res.send({ redirect: payload[req.body.redirect], status: 'success' });
    } else {
      res.send({ status: 'success', redirect: null });
    }
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.post('/user', async (req, res) => {
  if (!req.body.userId) {
    res.status(400).send('Missing url parameter: userId.');
  }
  try {
    const messages = await messageService.byUser(req.params.userId);
    res.send(messages);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.post('/:messageId/remove/:userId', async (req, res) => {
  if (!req.params.messageId) {
    res.status(400).send('Missing parameter: messageId.');
  }
  if (!req.params.userId) {
    res.status(400).send('Missing parameter: userId.');
  }
  try {
    const message = await messageService
      .remove(req.params.messageId, req.params.userId);
    res.send(message);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

export default router;
