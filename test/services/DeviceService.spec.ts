import 'mocha';
import chai from 'chai';
import subset from 'chai-subset';
import mongoose from 'mongoose';
import Device from '@/interfaces/Device';
import DeviceModel from '@/models/device';
import DeviceService from '@/services/DeviceService';
import device from '@test/data/device';

// Add extensions to chai
chai.use(subset);
const expect = chai.expect;

describe('DeviceService', () => {

  before('should establish a database connection.', (done) => {
    // connect to database
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', done);
    mongoose.connect(`mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service-test`);
  });

  it('should write a new device to the database.', async () => {
    const deviceId = await DeviceService.addDevice(device.platform, device.mail, device.tokens[0]);
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
    const deviceId = await DeviceService.addDevice(device.platform, device.mail, newToken);
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
    const tokens = await DeviceService.getDevices(device.platform, device.mail);

    expect(tokens)
      .to.containSubset(device.tokens);
  });

  after('should drop database and close connection', (done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });

});
