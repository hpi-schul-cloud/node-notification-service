import { Document, Schema, Model, model, Types } from 'mongoose';
import Device from '@/interfaces/Device';

export interface IDeviceModel extends Device, Document {
}

const deviceSchema = new Schema({
  userId: Types.ObjectId,
  platform: String,
  tokens: [String],
});

const deviceModel: Model<IDeviceModel> = model('Device', deviceSchema);

export default deviceModel;
