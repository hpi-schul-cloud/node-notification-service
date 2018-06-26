import EscalationLogic from "../services/EscalationLogic";
import Message from "@/interfaces/Message";
import MessageModel from "../models/message";
import axios from 'axios';

export default class MessageService {
  // region public static methods
  // endregion

  // region private static methods
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
  public async send(message: Message) {

    const databaseMessage = new MessageModel({
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


    const savedMessage = await databaseMessage.save();

    if (typeof message.receivers === 'string') {
      await this.writeReceiversToDatabase(savedMessage.id, message.receivers);
    }

    // this.escalationLogic.escalate(savedMessage.id);
  }
  // endregion

  // region private methods
  private async writeReceiversToDatabase(messageId: string, url: string) {
    console.log('fetching users');
    let pageUrl: string = url;
    do {
      const response = await axios.get(pageUrl);
      if (!response.data.data) {
        return;
      }

      await MessageModel.findOneAndUpdate(
        { _id: messageId },
        { '$addToSet': { 'receivers': { '$each': response.data.data } } },
        { 'upsert': true },
      );

      pageUrl = response.data.links.next;
    } while (pageUrl);
  }
  // endregion
}
