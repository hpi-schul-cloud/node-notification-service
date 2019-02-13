import express from 'express';
import DeviceService from '@/services/DeviceService';

const router: express.Router = express.Router();

router.post('/', async (req, res) => {
  if (!req.body.platform) {
    return res.status(400).send('Missing body parameter: platform.');
  }
  if (!req.body.userId) {
    return res.status(400).send('Missing body parameter: id.');
  }
  if (!req.body.token) {
    return res.status(400).send('Missing body parameter: token.');
  }

  try {
    await DeviceService.addDevice(req.body.platform, req.body.userId, req.body.token);
    res.send('The device has been added.');
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.get('/:platform/:id', async (req, res) => {
  if (!req.params.platform) {
    return res.status(400).send('Missing body parameter: platform.');
  }
  if (!req.params.userId) {
    return res.status(400).send('Missing body parameter: id.');
  }
  try {
    const devices = await DeviceService.getDevices(req.params.platform, req.params.id);
    res.send(devices);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.delete('/:platform/:userId/:token', (req, res) => {
  if (!req.params.platform) {
    return res.status(400).send('Missing body parameter: platform.');
  }
  if (!req.params.userId) {
    return res.status(400).send('Missing body parameter: id.');
  }
  if (!req.params.token) {
    return res.status(400).send('Missing body parameter: token.');
  }
  try {
    const devices = DeviceService.removeDevice(req.params.platform, req.params.id, req.params.token);
    res.send(devices);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default router;
