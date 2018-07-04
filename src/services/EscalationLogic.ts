import MailService from '../services/MailService';
import PushService from '../services/PushService';
import TemplatingService from '../services/TemplatingService';
import MessageModel from '../models/message';
import Message from '@/interfaces/Message';
import Utils from '../utils';

export default class EscalationLogic {
  // region public static methods
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members

  private mailService: MailService;
  private pushService: PushService;

  // endregion

  // region constructor

  public constructor() {
    this.mailService = new MailService();
    this.pushService = new PushService();
  }

  // endregion

  // region public methods

  public async escalate(messageId: string) {
    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new Error('Message not found in Database.');
    }

    // Construct Templating Service
    const templatingService = new TemplatingService(message.platform, message.template, message.payload);

    // Send push messages
    for (const receiver of message.receivers) {
      const pushMessage = templatingService.createPushMessage(receiver);
      this.pushService.send(message.platform, pushMessage);
    }

    // Send mail messages after 4 hours delay
    const config = Utils.getPlatformConfig(message.platform);
    setTimeout(this.sendMailMessages.bind(messageId, templatingService), config.mail.defaults.delay);
  }

  // endregion

  // region private methods

  private async sendMailMessages(messageId: string, templatingService: TemplatingService) {
    // Fetch message again to get updated list of receivers
    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new Error('Message not found in Database.');
    }

    for (const receiver of message.receivers) {
      const mailMessage = templatingService.createMailMessage(receiver);
      this.mailService.send(message.platform, mailMessage);
    }
  }

  // endregion
}
