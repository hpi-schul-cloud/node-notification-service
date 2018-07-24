import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import subset from 'chai-subset';
import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import MessageModel from '@/models/message';
import MessageService from '@/services/MessageService';
import message from '@test/data/message';

// Add extensions to chai
chai.use(spies);
chai.use(subset);
const expect = chai.expect;

describe('MessageService.send', () => {

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
    const spyFunction = chai.spy();
    (messageService as any).escalationLogic.escalate = spyFunction;

    await messageService.send(message);

    expect(spyFunction)
      .to.have.been.called();
  });

  it('should write the message to the database.', async () => {
    const messageId = await messageService.send(message);
    const databaseMessageModel = await MessageModel.findById(messageId);
    if (!databaseMessageModel) {
      expect(databaseMessageModel, 'Could not find message in database.').not.to.be.null;
      return;
    }
    const databaseMessage: Message = databaseMessageModel.toObject();

    expect(databaseMessage)
      .to.containSubset(message);
  });

  after('should close the database connection', () => {
    mongoose.disconnect();
  });

});
