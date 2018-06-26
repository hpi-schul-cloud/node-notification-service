import TemplatingService from "../services/TemplatingService";
import MailService from "../services/MailService";
import PushService from "../services/PushService";
import Message from "@/interfaces/Message";

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

  public escalate(messageId: string) {
    // const MessageModel = mongoose.model('Message', messageSchema);
    // MessageModel.findById(messageId, (err, message) => {
      // message ...
    // });

    const message: Message = { platform: '', template: '', content: {}, payload: [], receivers: [] };

    // TODO: Move this check to somewehere else
    if (typeof message.receivers === 'string') {
      message.receivers = [];
    }

    // Construct Templating Service
    const templatingService: TemplatingService = new TemplatingService(message.platform, message.template, message.payload, message.content);

    // Construct message for every single User
    for (const receiver of message.receivers) {
      const pushMessage = templatingService.createPushMessage(receiver);
      this.pushService.send(message.platform, pushMessage);

      // TODO: Send Mail Message after Timeout depending on notification settings
      const mailMessage = templatingService.createMailMessage(receiver);
      this.mailService.send(message.platform, mailMessage);
    }
  }

  // endregion

  // region private methods
  // endregion
}
