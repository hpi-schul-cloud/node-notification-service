import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';
import subset from 'chai-subset';
import mongoose from 'mongoose';
import MessageService from '@/services/MessageService';
import MessageModel from '@/models/message';
import RequestMessage from '@/interfaces/RequestMessage';
import { AssertionError } from 'assert';
import Message from '@/interfaces/Message';

// Add extensions to chai
chai.use(spies);
chai.use(subset);
const expect = chai.expect;

// Define constants
const platformId: string = 'testplatform';
const message: RequestMessage = {
  platform: 'test-platform',
  template: 'test-template',
  sender: {
    name: 'Test Sender',
    mail: 'sender@test.test',
  },
  payload: {
    testKey: 'test-value',
  },
  languagePayloads: [
    {
      language: 'en',
      payload: {
        testLanguageKey: 'test-language-value',
      },
    },
  ],
  receivers: [
    {
      name: 'Test Receiver',
      mail: 'receiver@test.test',
      payload: {
        testUserKey: 'test-user-value',
      },
      language: 'en',
    },
  ],
};

describe('MessageService.send function', () => {

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
      throw new AssertionError({ message: 'Could not find message in database.'});
    }
    const databaseMessage: Message = databaseMessageModel.toObject();

    expect(databaseMessage)
      .to.containSubset(message);
  });

});
