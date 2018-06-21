import EscalationLogic from "@/services/EscalationLogic";
import Message from "@/interfaces/Message";
import UserRessource from "@/interfaces/UserRessource";

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
  public send(message: Message) {
    let databaseMessage: Message = message;
    if (typeof message.receivers === 'string') {
      databaseMessage.receivers = [];
    }

    // TODO: Write message to database

    if (typeof message.receivers === 'string') {
      // TODO: Use write receivers function.
    }

    // TODO: Call escalation logic
  }
  // endregion

  // region private methods
  private writeReceiversToDatabase(messageId: string, url: string) {
    // TODO: Fetch users
    // TODO: Write batches of users to database
  }
  // endregion
}
