import mongoose from 'mongoose';
import Message from '@/interfaces/Message';

export interface IMessageModel extends Message, mongoose.Document {
  _receivers: mongoose.Types.DocumentArray<mongoose.Types.Subdocument>;
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

const messageModel: mongoose.Model<IMessageModel> = mongoose.model('Message', messageSchema);

export default messageModel;
