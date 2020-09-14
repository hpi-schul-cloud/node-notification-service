import DeviceModel from '@/models/device';
import logger from '@/helper/logger';
import mongoose from 'mongoose';

export default class DeviceService {
	// region public static methods
	public static async addDevice(
		platform: string,
		userId: mongoose.Types.ObjectId,
		token: string,
		service: string
	): Promise<string> {
		let device = await DeviceModel.findOne({ platform, userId, service });
		if (!device) {
			device = new DeviceModel({
				userId,
				platform,
				tokens: [],
				service,
			});
		}

		if (device.tokens.indexOf(token) === -1) {
			device.tokens.push(token);
		}

		const savedDevice = await device.save();
		return savedDevice.id;
	}

	public static async getDevices(
		platform: string,
		userId: mongoose.Types.ObjectId,
		service: string
	): Promise<string[]> {
		const devices = await DeviceModel.findOne({ platform, userId, service });
		if (!devices) {
			return [];
		}
		return devices.tokens;
	}

	/** removed a device, if only token defined it can remove multiple devices from different users if they have shared one device */
	public static async removeDevice(
		token: string,
		platform?: string,
		userId?: mongoose.Types.ObjectId
	): Promise<string[]> {
		if (userId && platform) {
			const device = await DeviceModel.findOne({ platform, userId, tokens: token });
			if (device) {
				const deleted = device.tokens.filter((t) => t === token);
				device.tokens = device.tokens.filter((t) => t !== token);
				await device.save();
				logger.info('devices removed', { deleted, token, userId, platform });
				return deleted;
			}
			logger.warn('no devices removed', { token, userId, platform });
			return [];
		} else {
			const devices = await DeviceModel.find({ tokens: token });
			if (devices && devices.length) {
				const deleted: string[] = [];
				const chain = devices.map(async (device) => {
					deleted.push(...device.tokens.filter((t) => t === token));
					device.tokens = device.tokens.filter((t) => t !== token);
					await device.save();
					return Promise.resolve();
				});
				return Promise.all(chain).then(() => {
					logger.debug('devices removed using token', { deleted, token });
					return deleted;
				});
			}
			logger.warn('no devices removed using token', { token });
			return [];
		}
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
