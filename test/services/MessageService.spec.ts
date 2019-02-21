import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import subset from 'chai-subset';
import asPromised = require('chai-as-promised');
import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import messageModel, { MessageModel } from '@/models/message';
import MessageService from '@/services/MessageService';
import message from '@test/data/message';
import config from '@test/config';
import RequestMessage from '@/interfaces/RequestMessage';

// Add extensions to chai
chai.use(spies);
chai.use(subset);
chai.use(asPromised);

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
    const databaseMessageModel = await messageModel.findById(messageId);
    if (!databaseMessageModel) {
      expect(databaseMessageModel, 'Could not find message in database.').not.to.be.null;
      return;
    }
    const databaseMessage: Message = databaseMessageModel.toObject();

    expect(databaseMessage).to.containSubset(message);
  });

  it('should mark the message as read.', async () => {
    const messageId = await messageService.send(message);
    let databaseMessageModel = await messageModel.findById(messageId);
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
    databaseMessageModel = await messageModel.findById(messageId);
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
    const databaseMessageModel = await messageModel.findById(messageId);
    if (!databaseMessageModel) {
      expect(databaseMessageModel, 'Could not find message in database.').not.to.be.null;
      return;
    }
    const databaseMessage: Message = databaseMessageModel.toObject();
    expect(
      databaseMessage.receivers.length,
      'Could not find any receiver in message',
    ).to.be.equal(2);
    const user: any = databaseMessage.receivers[0];
    await expect(messageService
      .seen(messageId, '307f191e813c19729de860ea'),
      'unknown receiverid should fail')
      .to.eventually.be.rejectedWith(Error);
    expect(await messageService
      .seen(messageId, user.userId),
      'first call adds seen callback')
      .to.containSubset({ seenCallback: { userId: user.Id } });
    expect(await messageService
      .seen(messageId, user.userId),
      'second call should be ignored')
      .to.containSubset({ seenCallback: { userId: user.Id } });
  });

  it.only('should return user messages as seen', async () => {
    const spyFunction = chai.spy();
    (messageService as any).escalationLogic.escalate = spyFunction;
    const messageId = await messageService.send(message);
    expect(spyFunction).to.have.been.called();
    const receivers: any = message.receivers;
    const userId = receivers[0].userId;
    await messageService.seen(messageId, userId);
    await messageService.seen(messageId, receivers[1].userId);
    const messages = await messageService.byUser(userId);
    expect(messages.length).to.be.greaterThan(0);
    const dbMessages: MessageModel[] = messages
      .filter((message: MessageModel) =>
        mongoose.Types.ObjectId(messageId).equals(message._id));
    expect(dbMessages.length).to.be.equal(1);
    const dbMessage = dbMessages[0];
    expect(dbMessage.receivers.length, // FIXME fails on travis
      'foreign receivers should be removed for export to user')
      .to.be.equal(1);
    expect(dbMessage.seenCallback.length,
      'foreign callbacks should be removed for export to user')
      .to.be.equal(1);
  });

  async function getMessage(messageId: string, userId: string) {
    const messages = await messageService.byUser(userId);
    const msg = messages.filter((m: any) => m._id.equals(messageId))[0];
    return msg;
  }

  it('should remove user message', async () => {
    const messageId = await messageService.send(message);
    const receivers: any = message.receivers;
    let userId = receivers[0].userId.toHexString();

    // remove user from message
    expect(await getMessage(messageId, userId)).to.be.not.equal(undefined);
    let removed = await messageService.remove(messageId, userId);
    expect(removed).to.not.containSubset({ receivers: [{ userId }] });
    expect(await getMessage(messageId, userId)).to.be.equal(undefined);

    // remove last user from message should remove message itself
    userId = receivers[1].userId.toHexString();
    expect(await getMessage(messageId, userId)).to.be.not.equal(undefined);
    let dbMessage = await messageModel.findById(messageId).exec();
    expect(dbMessage).to.be.not.equal(null);
    removed = await messageService.remove(messageId, userId);
    expect(removed).to.not.containSubset({ receivers: [{ userId }] });
    dbMessage = await messageModel.findById(messageId).exec();
    expect(dbMessage).to.be.equal(null);
  });

  after('should drop database and close connection', (done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
    });
  });
});
