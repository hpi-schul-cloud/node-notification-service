import winston from 'winston';
import DeviceModel from '@/models/device';
import Device from '../interfaces/Device';
import mongoose from 'mongoose';
import { error } from 'util';

export default class DeviceService {
  // region public static methods
  public static async addDevice(platform: string, userId: mongoose.Types.ObjectId, token: string): Promise<string> {
    let device = await DeviceModel.findOne({ platform, userId });
    if (!device) {
      device = new DeviceModel({
        userId,
        platform,
        tokens: [],
      });
      await device.save();
    }

    if (device.tokens.indexOf(token) === -1) {
      device.tokens.push(token);
    }


    const savedDevice = await device.save();

    return savedDevice.id;
  }

  public static async getDevices(platform: string, userId: mongoose.Types.ObjectId): Promise<string[]> {
    if (!userId) { throw new Error('userId missing'); }
    const devices = await DeviceModel.findOne({ platform, userId });
    if (!devices) {
      return [];
    }
    return devices.tokens;
  }


  public static async removeDevice(platform: string, userId: mongoose.Types.ObjectId, token: string): Promise<String[]> {

    const device = await DeviceModel.findOne({ platform, userId });
    if (device) {
      const deleted = device.tokens.filter((t) => t === token);
      device.tokens = device.tokens.filter((t) => t !== token);
      await device.save();
      return deleted;
    }
    return [];
  }
  // endregion

  // region private static methods
  // endregion

  // region public members
  // endregion

  // region private members
  // endregion

  // region constructor
  // endregion

  // region public methods
  // endregion

  // region private methods
  // endregion
}
