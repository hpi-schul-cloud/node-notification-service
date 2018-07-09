import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import UserRessource from '@/interfaces/UserRessource';

export interface UserRessourceModel extends UserRessource, mongoose.Types.Subdocument {}

export interface MessageModel extends Message, mongoose.Document {
  receivers: mongoose.Types.DocumentArray<UserRessourceModel>;
}

export const userRessourceSchema = new mongoose.Schema({
  name: String,
  mail: String,
  language: String,
  payload: Object,
});

export const messageSchema = new mongoose.Schema({
  platform: String,
  template: String,
  sender: {
    name: String,
    mail: String,
  },
  payload: [
    {
      language: String,
      payload: Object,
    },
  ],
  receivers: [ userRessourceSchema ],
  trackLinks: Boolean,
});

const messageModel: mongoose.Model<MessageModel> = mongoose.model('Message', messageSchema);

export default messageModel;
