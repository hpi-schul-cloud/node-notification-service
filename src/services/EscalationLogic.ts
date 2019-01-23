import winston from 'winston';
import MailService from '@/services/MailService';
import PushService from '@/services/PushService';
import TemplatingService from '@/services/TemplatingService';
import MessageModel from '@/models/message';
import Utils from '@/utils';
import DeviceService from '@/services/DeviceService';
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
    const databaseMessage = await MessageModel.findById(messageId);
    if (!databaseMessage) {
      const errorMessage = `Could not escalate Message: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    const message: Message = databaseMessage.toObject();

    // Construct Templating Service
    let templatingService: TemplatingService;

    // Send push messages
    for (const receiver of message.receivers) {
      if (!receiver.preferences.push) {
        continue;
      }

      const receiverDevices = await DeviceService.getDevices(message.platform, receiver.mail);
      for (const device of receiverDevices) {
        // todo avoid recreation of templatingService for each receiver device/user
        templatingService = new TemplatingService(message.platform, message.template,
          message.payload, message.languagePayloads, messageId, receiver.language);
        const pushMessage = templatingService.createPushMessage(receiver, device);
        this.pushService.send(message.platform, pushMessage);
      }
    }

    // Send mail messages after 4 hours delay
    const config = Utils.getPlatformConfig(message.platform);
    setTimeout(() => { this.sendMailMessages(messageId); }, config.mail.defaults.delay);
    // todo send mail message without delay if there was no push device registered
  }
  // endregion

  // region private methods
  private async sendMailMessages(messageId: string) {
    // Fetch message again to get updated list of receivers
    const message = await MessageModel.findById(messageId);

    if (!message) {
      const errorMessage = `Could not send mail messages: Message (id: ${messageId}) not found.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    for (const receiver of message.receivers) {
      if (!receiver.preferences.mail) {
        continue;
      }

      const templatingService = new TemplatingService(message.platform, message.template,
        message.payload, message.languagePayloads, messageId, receiver.language);

      const mailMessage = templatingService.createMailMessage(receiver);
      this.mailService.send(message.platform, mailMessage);
    }
  }
  // endregion
}
