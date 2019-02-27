import { messaging as firebaseMessaging } from 'firebase-admin';

export default interface PlatformPushTransporter {
	platformId: string;
	transporter: firebaseMessaging.Messaging;
}
