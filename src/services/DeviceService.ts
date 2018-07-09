import winston from 'winston';
import DeviceModel from '../models/device';

export default class DeviceService {
  // region public static methods
  public static async addDevice(mail: string, token: string) {
    let device = await DeviceModel.findOne({ mail });
    if (!device) {
      device = new DeviceModel({
        mail,
        tokens: [],
      });
      await device.save();
    }

    if (device.tokens.indexOf(token) !== -1) {
      const errorMessage = `Could not add Device: Device (mail: ${mail}, token: ${token}) already exists.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    device.tokens.push(token);
    await device.save();
  }

  public static async getDevices(mail: string): Promise<string[]> {
    const device = await DeviceModel.findOne({ mail });
    if (!device) {
      const errorMessage = `Could not find Device: Device (mail: ${mail}) does not exists.`;
      winston.error(errorMessage);
      throw new Error(errorMessage);
    }

    return device.tokens;
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
