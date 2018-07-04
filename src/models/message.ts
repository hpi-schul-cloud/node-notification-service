import mongoose from 'mongoose';

export interface IMessageModel extends mongoose.Document {
  receivers: mongoose.Types.DocumentArray<mongoose.Types.Subdocument>;
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
