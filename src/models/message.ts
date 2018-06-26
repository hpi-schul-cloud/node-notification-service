import mongoose from 'mongoose';
import userRessource from '../models/userRessource';

const messageScema = new mongoose.Schema({
  platform: String,
  template: String,
  sender: {
    name: String,
    mail: String,
  },
  payload:[{
    language: String,
    payload: Object,
  }],
  receivers: [ userRessource ],
  trackLinks: Boolean,
});

export default mongoose.model('Message', messageScema);
