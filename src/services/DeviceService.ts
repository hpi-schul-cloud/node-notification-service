import winston from 'winston';
import DeviceModel from '@/models/device';
import Device from '../interfaces/Device';
import mongoose from 'mongoose';
import { error } from 'util';

export default class DeviceService {
  // region public static methods
  public static async addDevice(platform: string, userId: mongoose.Types.ObjectId, token: string, service: string): Promise<string> {
    let device = await DeviceModel.findOne({ platform, userId, service });
    if (!device) {
      device = new DeviceModel({
        userId,
        platform,
        tokens: [],
        service,
      });
      await device.save();
    }

    if (device.tokens.indexOf(token) === -1) {
      device.tokens.push(token);
    }

    const savedDevice = await device.save();
    return savedDevice.id;
  }

  public static async getDevices(platform: string, userId: mongoose.Types.ObjectId, service: string): Promise<string[]> {
    const devices = await DeviceModel.findOne({ platform, userId, service });
    if (!devices) {
      return [];
    }
    return devices.tokens;
  }


  public static async removeDevice(platform: string, userId: mongoose.Types.ObjectId, token: string): Promise<String[]> {

    const device = await DeviceModel.findOne({ platform, userId, tokens: [token] });
    if (device) {
      const deleted = device.tokens.filter((t) => t === token);
      device.tokens = device.tokens.filter((t) => t !== token);
      await device.save();
      if (device.tokens.length === 0) {
        await device.remove();
      }
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
