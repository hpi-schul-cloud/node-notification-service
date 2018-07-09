import winston from 'winston';
import MailService from '../services/MailService';
import PushService from '../services/PushService';
import TemplatingService from '../services/TemplatingService';
import MessageModel from '../models/message';
import Utils from '../utils';
import DeviceService from '../services/DeviceService';

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
      const errorMessage = `Could not escalate Message: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Construct Templating Service
    const templatingService: TemplatingService = new TemplatingService(message.platform, message.template,
      message.payload);

    // Send push messages
    for (const receiver of message.receivers) {
      const receiverDevices = await DeviceService.getDevices(receiver.mail);
      for (const device of receiverDevices) {
        const pushMessage = templatingService.createPushMessage(receiver, device);
        this.pushService.send(message.platform, pushMessage);
      }
    }

    // Send mail messages after 4 hours delay
    const config = Utils.getPlatformConfig(message.platform);
    setTimeout(() => { this.sendMailMessages(messageId, templatingService); }, config.mail.defaults.delay);
  }
  // endregion

  // region private methods
  private async sendMailMessages(messageId: string, templatingService: TemplatingService) {
    // Fetch message again to get updated list of receivers
    const message =  await MessageModel.findById(messageId);

    if (!message) {
      const errorMessage = `Could not send mail messages: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    for (const receiver of message.receivers) {
      const mailMessage = templatingService.createMailMessage(receiver);
      this.mailService.send(message.platform, mailMessage);
    }
  }
  // endregion
}
