import EscalationLogic from '@/services/EscalationLogic';
import RequestMessage from '@/interfaces/RequestMessage';
import MessageModel from '@/models/message';
import Message from '@/interfaces/Message';
import mongoose from 'mongoose';
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

  private static async messageSeen(messageId: string, userId: mongoose.Types.ObjectId) {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      const errorMessage = `Could not unregister Notification: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }
    if (message.seenCallback.filter(cb => cb.userId === userId).length === 0) {
      message.seenCallback.push({ userId, createdAt: Date.now() });
      return await message.save();
    } else {
      return message;
    }
  }

  private static async unregisterNotification(messageId: string, userId: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      const errorMessage = `Could not unregister Notification: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    const user = message.receivers.find((receiver) => receiver._id.toString() === userId.toString());
    if (!user) {
      const errorMessage = `Could not unregister Notification: User (id: ${userId}) not found in Message (id: ${messageId}).`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    message.receivers.pull(user._id);
    return await message.save();
  }

  /**
   * populates and cleanup message from other users data like other receivers or callbacks 
   * @param message
   * @param userId 
   */
  private static filter(message: Message, userId: mongoose.Types.ObjectId) {
    message.receivers = message.receivers.filter(receiver => receiver.userId.equals(userId));
    message.seenCallback = message.seenCallback.filter(callback => callback.userId.equals(userId));
    return message;
  }

  private static async messagesByUser(userId: mongoose.Types.ObjectId) {
    const messages = await MessageModel
      .find({ 'receivers.userId': { $in: userId } })
      .populate({ path: 'receivers' })
      .populate({ path: 'seenCallback' })
      .exec();
    if (messages && messages.length !== 0) {
      return messages.map(message => this.filter(message.toObject(), userId));
    } else {
      return [];
    }
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
  public async send(message: RequestMessage): Promise<string> {
    const messageId = await MessageService.save(message);
    await this.escalationLogic.escalate(messageId);
    return messageId;
  }

  public async seen(messageId: string, userId: string) {
    return await MessageService.messageSeen(messageId, mongoose.Types.ObjectId(userId));
  }

  public async remove(messageId: string, userId: string) {
    //return await MessageService.unregisterNotification(messageId, userId);
    // todo remove message if last receiver has beren removed
    // todo test this
  }

  public async byUser(userId: string): Promise<any> {
    // todo add paging
    return await MessageService.messagesByUser(mongoose.Types.ObjectId(userId));
  }
  // endregion

  // region private methods
  // endregion
}
