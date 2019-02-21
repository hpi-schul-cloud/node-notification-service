import { Document, Schema, Model, model, Types } from 'mongoose';
import Device from '@/interfaces/Device';
import utils from '@/utils';

export interface IDeviceModel extends Device, Document {
}

const deviceSchema = new Schema({
  userId: { type: Types.ObjectId, required: true },
  platform: { type: String, required: true },
  service: { type: String, required: true, enum: utils.serviceEnum() },
  tokens: [String],
});

deviceSchema.post('save', async function (device: IDeviceModel) {
  if (device.tokens.length === 0) {
    await device.remove();
  }
});

const deviceModel: Model<IDeviceModel> = model('Device', deviceSchema);

export default deviceModel;
