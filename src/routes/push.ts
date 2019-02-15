import winston from 'winston';
import { messaging as firebaseMessaging, FirebaseError } from 'firebase-admin';
import express from 'express';
import PushService from '@/services/PushService';
import DeviceService from '@/services/DeviceService';
import mongoose from 'mongoose';

const router: express.Router = express.Router();
const pushService: PushService = new PushService();

const PromiseAny = function (promises: Array<Promise<any>>) {
  return new Promise(function (resolve, reject) {
    let count = promises.length,
      resolved = false;
    if (count === 0) {
      reject(new Error('No promises resolved successfully.'));
    }
    promises.forEach(function (p) {
      Promise.resolve(p).then(
        function (value) {
          resolved = true;
          count--;
          resolve(value);
        },
        function () {
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

  const push: firebaseMessaging.Message = {
    token: req.body.token,
    data: req.body.data,
    notification: req.body.notification,
    android: req.body.android,
    webpush: req.body.webpush,
    apns: req.body.apns,
  };

  // let messageQueue: Promise<any>[] = [];

  // req.body.receivers.map( (receiver: UserResource) => {

  //   return DeviceService.getDevices(req.body.platform, receiver._id)
  //   .then(devices =>{
  //     for (const device of devices) {
  //       const pushMessage = templatingService.createPushMessage(receiver, device);
  //       messageQueue.push(pushService.send(req.body.platform, pushMessage)
  //       .then((response: any) => {
  //         winston.info(response);
  //       }).catch(async (e: FirebaseError) => {
  //         if (e.code === 'messaging/registration-token-not-registered') {
  //           await pushService.removeToken(req.body.platformId, receiver._id, device);
  //         }
  //         winston.error(e);
  //       }));
  //     }
  //     return;
  //   });
  // }).then((_:any) =>{
  //   return PromiseAny(messageQueue)
  //     .then(_ => {
  //       res.send('Push queued.');
  //     }).catch(err => {
  //       res.status(500).send(err);
  //     });
  // });

  // todo fix promiseany to resolve

  Promise.all(
    req.body.receivers.map((userId: string) => {
      DeviceService.getDevices(req.body.platform, mongoose.Types.ObjectId(userId))
        .then((devices: any) => {
          return [].concat.apply([], devices); // flatten array
        })
        .then((devices: any[]) => {
          if (devices.length === 0) {
            return Promise.reject('no devices found');
          }
          return PromiseAny(
            devices.map((device: string) => {
              const pushMessage = Object.assign({}, push, { token: device });
              pushService.send(req.body.platform, pushMessage);
              return pushService
                .send(req.body.platform, pushMessage)
                .then((response: any) => {
                  winston.info(response);
                  return Promise.resolve();
                })
                .catch((e: FirebaseError) => {
                  // todo move to pushService
                  if (
                    e.code === 'messaging/registration-token-not-registered'
                  ) {
                    pushService.removeToken(
                      req.body.platform,
                      userId,
                      device,
                    );
                  }
                  winston.error(e);
                  return Promise.reject(e);
                });
            }),
          );
        })
        .then((_) => {
          res.send('Push queued.');
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }),
  );
});

export default router;
