import winston from 'winston';
import { messaging as firebaseMessaging, FirebaseError } from 'firebase-admin';
import express from 'express';
import PushService from '@/services/PushService';
import DeviceService from '@/services/DeviceService';
import device from '@test/data/device';

const router: express.Router = express.Router();
const pushService: PushService = new PushService();

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

router.post('/', (req, res) => {
  const push: firebaseMessaging.Message = {
    token: req.body.token,
    data: Object.assign({},req.body.data,{_id:guid()}),
    notification: req.body.notification,
    android: req.body.android,
    webpush: req.body.webpush,
    apns: req.body.apns,
  };

  Promise.all(req.body.receivers.map((user:string) => {
    DeviceService.getDevices(req.body.platformId, user)
    .then((devices:any) =>{
    return [].concat.apply([],devices); // flatten array
  }).then((devices:any)=>{
    return Promise.all(devices.map((device:string) =>{
      const message = Object.assign({},push,{token: device});
      return pushService.send(req.body.platformId, message)
      .then((response: any) => {
        winston.info(response);
        return Promise.resolve();
      })
      .catch((e: FirebaseError) => {
        if(e.code === 'messaging/registration-token-not-registered'){
          pushService.removeToken(req.body.platformId, user, device);
        }
        winston.error(e);
        return Promise.reject(e);
      });
    }));
  }).then(_=>{
    res.send('Push queued.');
  }).catch(err =>{
    res.status(500).send(err);
  });
}));

  

});

export default router;
