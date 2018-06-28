import mongoose from 'mongoose';
import userRessource from '../models/userRessource';

export interface IMessageModel extends mongoose.Document {
  receivers: mongoose.Types.DocumentArray<mongoose.Types.Subdocument>;
}

const messageScema = new mongoose.Schema({
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
  receivers: [ userRessource ],
  trackLinks: Boolean,
});

const model: mongoose.Model<IMessageModel> = mongoose.model('Message', messageScema);

export default model;
