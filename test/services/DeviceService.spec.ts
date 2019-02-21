import 'mocha';
import chai from 'chai';
import subset from 'chai-subset';
import mongoose from 'mongoose';
import Device from '@/interfaces/Device';
import DeviceModel from '@/models/device';
import DeviceService from '@/services/DeviceService';
import device from '@test/data/device';
import config from '@test/config';

// Add extensions to chai
chai.use(subset);
const expect = chai.expect;

const SERVICE = 'firebase';

describe('DeviceService', () => {

  before('should establish a database connection.', (done) => {
    // connect to database
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', done);
    mongoose.connect(config.MONGO_DB_PATH);
  });

  it('should write a new device to the database.', async () => {
    const deviceId = await DeviceService.addDevice(device.platform, device.userId, device.tokens[0], SERVICE);
    const databaseDeviceModel = await DeviceModel.findById(deviceId);
    if (!databaseDeviceModel) {
      expect(databaseDeviceModel, 'Could not find device in database.').not.to.be.null;
      return;
    }
    const databaseDevice: Device = databaseDeviceModel.toObject();

    expect(databaseDevice)
      .to.containSubset(device);
  });

  it('should add new token to existing device in the database.', async () => {
    const newToken = 'bshC5cgaggfa31hgR';
    const deviceId = await DeviceService.addDevice(device.platform, device.userId, newToken, SERVICE);
    const databaseDeviceModel = await DeviceModel.findById(deviceId);
    if (!databaseDeviceModel) {
      expect(databaseDeviceModel, 'Could not find device in database.').not.to.be.null;
      return;
    }
    const databaseDevice: Device = databaseDeviceModel.toObject();

    const modifiedDevice = Object.assign({}, device);
    modifiedDevice.tokens.push(newToken);

    expect(databaseDevice.tokens)
      .to.deep.equal(modifiedDevice.tokens);
  });

  it('should get tokens for existing device in the database.', async () => {
    const tokens = await DeviceService.getDevices(device.platform, device.userId, SERVICE);

    expect(tokens)
      .to.containSubset(device.tokens);
  });

  it('should remove a device from database', async () => {
    const newToken = 'cshC5cgaggfa31hgR';
    const userId = mongoose.Types.ObjectId('aade40c86362e0fb12000003');
    const deviceId = await DeviceService.addDevice(device.platform, userId, newToken, SERVICE);
    const removedId = await DeviceService.removeDevice(newToken, device.platform, userId);
    expect(removedId, 'removed device').to.include(newToken);
    const emptyList = await DeviceService.removeDevice(newToken, device.platform, userId);
    expect(emptyList.length, 'device already removed').to.be.equal(0);
  });

  it('should remove a device from database with only a token defined', async () => {
    const newToken = 'jweiofjmewof43ef343fr3rfcr3';
    const userId = mongoose.Types.ObjectId('dede40c86362e0fb12000003');
    const deviceId = await DeviceService.addDevice(device.platform, userId, newToken, SERVICE);
    const removedId = await DeviceService.removeDevice(newToken);
    expect(removedId, 'removed device').to.include(newToken);
    expect(removedId.length, 'only one device has been removed').to.be.equal(1);
    const emptyList = await DeviceService.removeDevice(newToken);
    expect(emptyList.length, 'device already removed').to.be.equal(0);
  });


  it('should remove all related devices from database with only a token defined', async () => {
    const newToken = 'f4jfi039fj089fj903ij49';
    const userIds = [
      mongoose.Types.ObjectId('cdcd40c86362e0fb12000001'),
      mongoose.Types.ObjectId('cdcd40c86362e0fb12000002')
    ];
    return Promise.all(userIds.map(userId => DeviceService.addDevice(device.platform, userId, newToken, SERVICE)))
      .then(async deviceIds => {
        const removedId = await DeviceService.removeDevice(newToken);
        expect(removedId.length, 'only one device has been removed').to.be.equal(2);
        expect(removedId[0], 'removed device').to.be.equal(newToken);
        expect(removedId[1], 'removed device').to.be.equal(newToken);
        const emptyList = await DeviceService.removeDevice(newToken);
        expect(emptyList.length, 'devices already removed').to.be.equal(0);
      });
  });



  after('should drop database and close connection', (done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });

});
