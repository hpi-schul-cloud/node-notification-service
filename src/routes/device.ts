import express from 'express';
import DeviceService from '../services/DeviceService';

const router: express.Router = express.Router();

router.post('/', async (req, res) => {
  if (!req.body.mail) {
    res.status(400).send('Missing body parameter: mail.');
  }
  if (!req.body.token) {
    res.status(400).send('Missing body parameter: token.');
  }

  try {
    await DeviceService.addDevice(req.body.mail, req.body.token);
    res.send('The device has been added.');
  } catch (e) {
    res.status(400).send(e.message);
  }
});

export default router;
