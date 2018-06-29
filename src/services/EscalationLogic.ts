import MailService from '../services/MailService';
import PushService from '../services/PushService';
import TemplatingService from '../services/TemplatingService';
import MessageModel from '../models/message';
import Message from '@/interfaces/Message';

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
    await MessageModel.findById(messageId, (err, message: Message) => {
      // Construct Templating Service
      const templatingService: TemplatingService = new TemplatingService(message.platform, message.template,
         message.payload);

      // Send push messages
      for (const receiver of message.receivers) {
        const pushMessage = templatingService.createPushMessage(receiver);
        this.pushService.send(message.platform, pushMessage);
      }

      // Send mail messages after 4 hours delay
      setTimeout(this.sendMailMessages(messageId, templatingService), 144000);
    });
  }

  // endregion

  // region private methods

  private sendMailMessages(messageId: string, templatingService: TemplatingService) {
    // Fetch message again to get updated list of receivers
    MessageModel.findById(messageId, (err, message: Message) => {
      for (const receiver of message.receivers) {
        const mailMessage = templatingService.createMailMessage(receiver);
        this.mailService.send(message.platform, mailMessage);
      }
    });
  }

  // endregion
}
