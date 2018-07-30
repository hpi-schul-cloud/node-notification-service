import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import UserResource from '@/interfaces/UserResource';

export interface UserResourceModel extends UserResource, mongoose.Types.Subdocument {}

export interface MessageModel extends Message, mongoose.Document {
  receivers: mongoose.Types.DocumentArray<UserResourceModel>;
}

export const userResourceSchema = new mongoose.Schema({
  name: String,
  mail: String,
  payload: Object,
  language: String,
  disabledPushMessages: { type: Boolean, default: false },
});

export const messageSchema = new mongoose.Schema({
  platform: String,
  template: String,
  sender: {
    name: String,
    mail: String,
  },
  payload: Object,
  languagePayloads: [
    {
      language: String,
      payload: Object,
    },
  ],
  receivers: [ userResourceSchema ],
  trackLinks: Boolean,
});

const messageModel: mongoose.Model<MessageModel> = mongoose.model('Message', messageSchema);

export default messageModel;
