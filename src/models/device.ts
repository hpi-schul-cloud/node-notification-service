import { Document, Schema, Model, model } from 'mongoose';
import Device from '@/interfaces/Device';

export interface IDeviceModel extends Device, Document {
}

const deviceSchema = new Schema({
  platform: String,
  mail: String,
  tokens: [ String ],
});

const deviceModel: Model<IDeviceModel> = model('Device', deviceSchema);

export default deviceModel;
