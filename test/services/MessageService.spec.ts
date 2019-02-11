import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import subset from 'chai-subset';
import asPromised = require('chai-as-promised');
import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import MessageModel from '@/models/message';
import MessageService from '@/services/MessageService';
import message from '@test/data/message';
import config from '@test/config';
import UserResource from '@/interfaces/UserResource';
import RequestMessage from '@/interfaces/RequestMessage';

// Add extensions to chai
chai.use(spies);
chai.use(subset);
chai.use(asPromised)

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
    await messageService.seen(messageId, user.userId);
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
    ).to.containSubset({ userId: user.userId });
  });

  it('only receivers can mark the message as read', async () => {
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
    // unknown receiverid should fail
    await expect(messageService
      .seen(messageId, '307f191e813c19729de860ea'))
      .to.eventually.be.rejectedWith(Error);
    // first call adds seen callback
    expect(await messageService
      .seen(messageId, user.userId))
      .to.be.equal('added');
    // second call should be ignored
    expect(await messageService
      .seen(messageId, user.userId))
      .to.be.equal('already seen');
  });

  it('should return user messages as seen', async () => {
    const messageId = await messageService.send(message);
    const receivers: any = message.receivers;
    const userId = receivers[0].userId;
    await messageService.seen(messageId, userId);
    await messageService.seen(messageId, receivers[1].userId);
    const messages = await messageService.byUser(userId);
    expect(messages.length).to.be.greaterThan(0);
    const dbMessage: RequestMessage = messages
      .filter((message: any) => message._id
        .equals(mongoose.Types.ObjectId(messageId)))[0];
    expect(dbMessage.receivers.length,
      'foreign receivers should be removed for export to user')
      .to.be.equal(1);
    expect(dbMessage.seenCallback.length,
      'foreign callbacks should be removed for export to user')
      .to.be.equal(1);
  });

  after('should drop database and close connection', (done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
});
