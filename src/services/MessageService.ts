import EscalationLogic from '../services/EscalationLogic';
import RequestMessage from '@/interfaces/RequestMessage';
import MessageModel from '../models/message';
import axios from 'axios';

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
    this.escalationLogic.escalate(messageId);
  }
  // endregion

  // region private methods
  // endregion
}
