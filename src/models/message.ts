import mongoose from 'mongoose';
import Message from '@/interfaces/Message';
import UserResource from '@/interfaces/UserResource';
import Callback from '@/interfaces/Callback';

export interface UserResourceModel extends UserResource, mongoose.Types.Subdocument { }
export interface CallbackModel extends Callback, mongoose.Types.Subdocument { }

export interface MessageModel extends Message, mongoose.Document {
  receivers: mongoose.Types.DocumentArray<UserResourceModel>;
  seenCallback: mongoose.Types.DocumentArray<CallbackModel>;
}

export const userResourceSchema = new mongoose.Schema({
  name: String,
  mail: String,
  userId: mongoose.Types.ObjectId,
  payload: Object,
  language: String,
  preferences: Object,
});

export const callbackSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
}, { timestamps: { createdAt: true, updatedAt: false } });

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
  receivers: [userResourceSchema],
  trackLinks: Boolean,
  seenCallback: [callbackSchema],
}, { timestamps: { createdAt: true, updatedAt: false } });

messageSchema.post('save', async function(message: MessageModel) {
  if (message.receivers.length === 0) {
    await message.remove();
  }
});

const messageModel: mongoose.Model<MessageModel> = mongoose.model('Message', messageSchema);

export default messageModel;
