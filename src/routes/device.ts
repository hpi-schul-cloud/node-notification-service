import express from 'express';
import DeviceService from '../services/DeviceService';

const router: express.Router = express.Router();

router.post('/', (req, res) => {
  DeviceService.addDevice(req.body.mail, req.body.token);

  res.send('Device added.');
});

export default router;
