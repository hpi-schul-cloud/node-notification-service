import winston from 'winston';
import DeviceModel from '../models/device';

export default class DeviceService {
  // region public static methods
  public static async addDevice(mail: string, token: string) {
    let device = await DeviceModel.findOne({ mail });
    if (!device) {
      device = await DeviceService.save(mail);
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
  private static async save(mail: string) {

    const deviceModel = new DeviceModel({
      mail,
      tokens: [],
    });

    return await deviceModel.save();
  }
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
