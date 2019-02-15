import express from 'express';
import DeviceService from '@/services/DeviceService';
import utils from '@/utils';
const router: express.Router = express.Router();

router.post('/', async (req, res) => {

  if (utils.parametersMissing(['platform', 'userId', 'token', 'service'], req.params, res)) return;

  try {
    await DeviceService.addDevice(req.body.platform, req.body.userId, req.body.token, req.body.service);
    res.send('The device has been added.');
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.get('/:platform/:id', async (req, res) => {

  if (utils.parametersMissing(['platform', 'userId', 'service'], req.params, res)) return;

  try {
    const devices = await DeviceService.getDevices(req.params.platform, req.params.id, req.params.service);
    res.send(devices);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.delete('/:platform/:userId/:token', (req, res) => {

  if (utils.parametersMissing(['platform', 'userId', 'token'], req.params, res)) return;

  try {
    const devices = DeviceService.removeDevice(req.params.platform, req.params.userId, req.params.token);
    res.send(devices);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default router;
