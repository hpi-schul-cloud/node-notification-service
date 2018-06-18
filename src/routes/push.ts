import { messaging as firebaseMessaging } from 'firebase-admin';
import express from 'express';
import PushService from '../services/PushService';

const router: express.Router = express.Router();
const pushService: PushService = new PushService();

router.post('/', (req, res) => {
  const push: firebaseMessaging.Message = {
    token: req.body.token,
    data: req.body.data,
    notification: req.body.notification,
    android: req.body.android,
    webpush: req.body.webpush,
    apns: req.body.apns
  };

  pushService.send(req.body.platformId, push)
    .then((response: any) => {
      console.log(response);
    })
    .catch((e: Error) => {
      console.log('Error: ' + e);
    });

    res.send('Push queued.');
});

export default router;
