import winston from 'winston';
import { messaging as firebaseMessaging, FirebaseError } from 'firebase-admin';
import express from 'express';
import PushService from '@/services/PushService';
import DeviceService from '@/services/DeviceService';
import mongoose from 'mongoose';
import utils from '@/utils';
import TemplatingService from '@/services/TemplatingService';
import Utils from '@/utils';

const router: express.Router = express.Router();
const pushService: PushService = new PushService();

const PromiseAny = function(promises: Array<Promise<any>>) {
  return new Promise(function(resolve, reject) {
    let count = promises.length,
      resolved = false;
    if (count === 0) {
      reject(new Error('No promises resolved successfully.'));
    }
    promises.forEach(function(p) {
      Promise.resolve(p).then(
        function(value) {
          resolved = true;
          count--;
          resolve(value);
        },
        function() {
          count--;
          if (count === 0 && !resolved) {
            reject(new Error('No promises resolved successfully.'));
          }
        },
      );
    });
  });
};

router.post('/', (req, res) => {

  if (utils.parametersMissing(['platform', 'template', 'payload', 'languagePayloads', 'receivers'], req.body, res)) { return; }

  // Construct Templating Service
  let templatingService: TemplatingService;
  const messageId = Utils.guid();
  const queuedMessages: Array<Promise<any>> = [];

  try {
    // Send push messages
    for (const receiver of req.body.receivers) {
      if (!receiver.preferences.push) {
        continue;
      }
      const services = Utils.serviceEnum();
      services.forEach(async (service) => {
        const receiverDevices = await DeviceService.getDevices(req.body.platform, receiver.userId, service);
        for (const device of receiverDevices) {
          // todo avoid recreation of templatingService for each receiver device/user
          templatingService = new TemplatingService(req.body.platform, req.body.template,
            req.body.payload, req.body.languagePayloads, messageId, receiver.language);
          if (service == 'firebase') {
            const pushMessage = templatingService.createPushMessage(receiver, device);
            // FIXME add queuing, add rest route for queue length
            queuedMessages.push(pushService.send(req.body.platform, pushMessage));
          }
          if (service === 'safari') {
            // const pushMessage = templatingService.createSafariPushMessage(receiver, device);
            // // FIXME add queuing, add rest route for queue length
            // this.pushService.send(message.platform, pushMessage);
            winston.error('unsupported send service requested: ' + service);
          }
        }
      });
    }
    PromiseAny(queuedMessages)
      .then(() => res.send('Push queued.'));
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
