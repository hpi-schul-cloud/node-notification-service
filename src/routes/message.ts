import express from 'express';
import MessageService from '../services/MessageService';
import RequestMessage from '@/interfaces/RequestMessage';

const router: express.Router = express.Router();
const messageService: MessageService = new MessageService();

router.post('/', (req, res) => {
  const message: RequestMessage = {
    platform: req.body.platform,
    template: req.body.template,
    payload: req.body.payload,
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

export default router;
