import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import subset from 'chai-subset';
import mongoose from 'mongoose';
import EscalationLogic from '@/services/EscalationLogic';
import message from '@test/data/message';
import MessageService from '@/services/MessageService';
import DeviceService from '@/services/DeviceService';
import device from '@test/data/device';
import Utils from '@/utils';

// Add extensions to chai
chai.use(spies);
const expect = chai.expect;

describe('EscalationLogic.escalate', () => {

  // Instantiate the service
  const messageService = new MessageService();

  before('should establish a database connection.', (done) => {
    // connect to database
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', done);
    mongoose.connect(`mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service-test`);
  });

  it('should call the escalation logic.', async () => {
    // add test device
    await DeviceService.addDevice(device.platform, device.mail, device.tokens[0]);

    // use spies for push and mail service
    const spyFunctionPush = chai.spy();
    const spyFunctionMail = chai.spy();
    (messageService as any).escalationLogic.pushService.send = spyFunctionPush;
    (messageService as any).escalationLogic.mailService.send = spyFunctionMail;

    await messageService.send(message);

    expect(spyFunctionPush)
      .to.have.been.called();

    const config = Utils.getPlatformConfig(message.platform);

    await new Promise((resolve) => {
      setTimeout(() => {
        expect(spyFunctionMail)
          .to.have.been.called();
        resolve();
      }, config.mail.defaults.delay + 1);
     });
  });

  after('should drop database and close connection', (done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });

});
