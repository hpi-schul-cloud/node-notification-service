import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import subset from 'chai-subset';
import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import MessageModel from '@/models/message';
import MessageService from '@/services/MessageService';
import message from '@test/data/message';
import config from '@test/config';
import UserResource from '@/interfaces/UserResource';

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
    mongoose.connect(config.MONGO_DB_PATH);
  });

  it('should call the escalation logic.', async () => {
    const spyFunction = chai.spy();
    (messageService as any).escalationLogic.escalate = spyFunction;

    await messageService.send(message);

    expect(spyFunction).to.have.been.called();
  });

  it('should write the message to the database.', async () => {
    const messageId = await messageService.send(message);
    const databaseMessageModel = await MessageModel.findById(messageId);
    if (!databaseMessageModel) {
      expect(databaseMessageModel, 'Could not find message in database.').not.to.be.null;
      return;
    }
    const databaseMessage: Message = databaseMessageModel.toObject();

    expect(databaseMessage).to.containSubset(message);
  });

  it('should mark the message as read.', async () => {
    const messageId = await messageService.send(message);
    let databaseMessageModel = await MessageModel.findById(messageId);
    if (!databaseMessageModel) {
      expect(databaseMessageModel, 'Could not find message in database.').not.to.be.null;
      return;
    }
    let databaseMessage: Message = databaseMessageModel.toObject();
    expect(
      databaseMessage.receivers.length,
      'Could not find any receiver in message',
    ).to.be.equal(2);
    const user: any = databaseMessage.receivers[0];
    await messageService.seen(messageId, user._id);
    databaseMessageModel = await MessageModel.findById(messageId);
    if (!databaseMessageModel) {
      expect(databaseMessageModel, 'Could not find message in database.').not.to.be.null;
      return;
    }
    databaseMessage = databaseMessageModel.toObject();
    if (!databaseMessage) {
      expect(databaseMessage, 'Could not find message in database.').not.to.be.null;
      return;
    }
    expect(
      databaseMessage.seenCallback[0],
      'Could not mark message seen by first receiver',
    ).to.containSubset({ userId: user._id });
  });

  it('should return user messages as seen', async () => {
    const messageId = await messageService.send(message);
    const receivers: any = message.receivers;
    const userId = receivers[0].userId;
    await messageService.seen(messageId, userId);
    await messageService.seen(messageId, '507f191e810c19729de860ea');
    const messages = await messageService.byUser(userId);
    expect(messages.length).to.be.greaterThan(0);
    const dbMessage = messages.filter((message: any) => message._id.equals(messageId))[0];
    expect(dbMessage.receivers.length, 'foreign receivers should be removed for export to user').to.be.equal(1);
    expect(dbMessage.seenCallback.length, 'foreign callbacks should be removed for export to user').to.be.equal(1);
  });

  after('should drop database and close connection', (done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
});
