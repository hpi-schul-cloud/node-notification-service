import firebaseAdmin, { messaging as firebaseMessaging } from 'firebase-admin';
import BaseService from '@/services/BaseService';
import DeviceService from './DeviceService';
import mongoose from 'mongoose';
import PlatformPushTransporter from '@/interfaces/PlatformPushTransporter';

export default class PushService extends BaseService {
	public constructor(name: string) {
		super(name);
	}

	public removeToken(platform: string, userId: string, device: string): any {
		return DeviceService.removeDevice(device, platform, mongoose.Types.ObjectId(userId));
	}

	protected _send(transporter: PlatformPushTransporter, push: firebaseMessaging.Message): Promise<string> {
		return transporter.transporter.send(push).catch(async (error) => {
			if (error.code === 'messaging/registration-token-not-registered') {
				await DeviceService.removeDevice((push as any).token);
			}
			return Promise.reject(error);
		});
	}

	protected _createTransporters(platformId: string, config: any): PlatformPushTransporter[] {
		const transporter = firebaseAdmin.initializeApp({
			// https://stackoverflow.com/questions/40799258/where-can-i-get-serviceaccountcredentials-json-for-firebase-admin
			credential: firebaseAdmin.credential.cert(config.push.service_account_object),
			databaseURL: config.push.databaseURL,
		}).messaging();

		return [{
			platformId,
			transporter,
		}];
	}

	protected _serviceType(): string {
		return 'push';
	}
}
