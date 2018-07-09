import EscalationLogic from '../services/EscalationLogic';
import RequestMessage from '@/interfaces/RequestMessage';
import MessageModel from '../models/message';
import axios from 'axios';
import winston from 'winston';

export default class MessageService {
  // region public static methods
  // endregion

  // region private static methods
  private static async save(message: RequestMessage): Promise<string> {

    const messageModel = new MessageModel({
      platform: message.platform,
      template: message.template,
      sender: {
        name: message.sender ? message.sender.name : '',
        mail: message.sender ? message.sender.mail : '',
      },
      payload: message.payload,
      languagePayloads: message.languagePayloads,
      receivers: typeof message.receivers === 'string' ? [] : message.receivers,
      trackLinks: message.trackLinks ? message.trackLinks : true,
    });

    const savedMessage = await messageModel.save();

    if (typeof message.receivers === 'string') {
      await MessageService.updateReceivers(savedMessage.id, message.receivers);
    }

    return savedMessage.id;
  }

  private static async updateReceivers(messageId: string, url: string) {
    let pageUrl: string = url;

    do {
      const response = await axios.get(pageUrl);
      if (!response.data.data) {
        return;
      }

      await MessageModel.findOneAndUpdate(
        { _id: messageId },
        { $addToSet: { receivers: { $each: response.data.data } } },
        { upsert: true },
      );

      pageUrl = response.data.links.next;

    } while (pageUrl);
  }

  private static async unregisterNotification(messageId: string, userId: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      const errorMessage = `Could not unregister Notification: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    const user = message.receivers.find((receiver) => receiver._id.toString() === userId);
    if (!user) {
      const errorMessage = `Could not unregister Notification: User (id: ${userId}) not found in Message (id: ${messageId}).`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    message.receivers.pull(user._id);
    await message.save();
  }
  // endregion

  // region public members
  // endregion

  // region private members
  private escalationLogic: EscalationLogic;
  // endregion

  // region constructor
  public constructor() {
    this.escalationLogic = new EscalationLogic();
  }
  // endregion

  // region public methods
  public async send(message: RequestMessage) {
    const messageId = await MessageService.save(message);
    await this.escalationLogic.escalate(messageId);
  }

  public async seen(messageId: string, userId: string) {
    return await MessageService.unregisterNotification(messageId, userId);
  }
  // endregion

  // region private methods
  // endregion
}
