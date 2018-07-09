import express from 'express';
import MessageService from '../services/MessageService';
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

router.post('/:messageId/seen', async (req, res) => {
  if (!req.params.messageId) {
    res.status(400).send('Missing url parameter: messageId.');
  }
  if (!req.body.userId) {
    res.status(400).send('Missing body parameter: userId.');
  }

  try {
    await messageService.seen(req.params.messageId, req.body.userId);
    res.send('The message has been marked as seen.');
  } catch (e) {
    res.status(400).send(e.message);
  }
});

export default router;
